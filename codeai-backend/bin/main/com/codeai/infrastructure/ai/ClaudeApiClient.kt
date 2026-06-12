package com.codeai.infrastructure.ai

import com.codeai.domain.review.ReviewSeverity
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

private val EXCLUDED_DIFF_PREFIXES = listOf("bin/", "build/", ".gradle/", ".idea/", "out/", "target/")

@Component
class ClaudeApiClient(
    @Value("\${claude.api.key}") private val apiKey: String,
    @Value("\${claude.api.max-tokens}") private val maxTokens: Int,
    @Value("\${claude.api.model:claude-haiku-4-5-20251001}") private val model: String,
    @Value("\${claude.api.max-chunks:10}") private val maxChunks: Int,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    private val webClient = WebClient.builder()
        .baseUrl("https://api.anthropic.com")
        .defaultHeader("x-api-key", apiKey)
        .defaultHeader("anthropic-version", "2023-06-01")
        .defaultHeader("Content-Type", "application/json")
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    private fun filterDiff(diff: String): String {
        val sections = diff.split(Regex("(?=\\ndiff --git )"))
        return sections.filter { section ->
            EXCLUDED_DIFF_PREFIXES.none { prefix ->
                section.contains("diff --git a/$prefix") || section.contains("diff --git b/$prefix")
            }
        }.joinToString("")
    }

    suspend fun review(diff: String, promptVersion: String): ReviewResult {
        val filtered = filterDiff(diff)
        val maskedDiff = MaskingUtil.mask(filtered)
        val allChunks = DiffTokenizer.splitByTokenBudget(maskedDiff, maxTokens)
        val chunks = allChunks.take(maxChunks)

        if (allChunks.size > maxChunks) {
            log.warn("diff ${allChunks.size}청크 → ${maxChunks}청크로 제한 (비용 절감)")
        }

        val allComments = mutableListOf<ParsedComment>()
        var totalTokens = 0

        for (chunk in chunks) {
            val prompt = ClaudeReviewPrompt.build(chunk, promptVersion)
            val result = callApi(prompt)
            allComments.addAll(result.comments)
            totalTokens += result.tokensUsed
        }

        log.info("Claude 리뷰 완료: ${allComments.size}건, 토큰=${totalTokens}, 모델=${model}")
        return ReviewResult(allComments, totalTokens)
    }

    private suspend fun callApi(prompt: String): ApiCallResult {
        val requestBody = mapOf(
            "model" to model,
            "max_tokens" to maxTokens,
            "messages" to listOf(mapOf("role" to "user", "content" to prompt))
        )

        @Suppress("UNCHECKED_CAST")
        val response = try {
            webClient.post()
                .uri("/v1/messages")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map::class.java)
                .awaitSingle() as Map<String, Any?>
        } catch (e: org.springframework.web.reactive.function.client.WebClientResponseException) {
            log.error("Claude API 에러 - 상태: ${e.statusCode}, 응답 본문: ${e.responseBodyAsString}")
            throw e
        }

        val content = (response["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
        val text = content?.get("text") as? String ?: return ApiCallResult(emptyList(), 0)

        val usage = response["usage"] as? Map<*, *>
        val tokensUsed = ((usage?.get("input_tokens") as? Number)?.toInt() ?: 0) +
                ((usage?.get("output_tokens") as? Number)?.toInt() ?: 0)

        return ApiCallResult(parseComments(text), tokensUsed)
    }

    private fun recoverTruncatedJson(json: String): String {
        // max_tokens 초과로 JSON이 잘린 경우 마지막 완전한 이슈 객체까지만 복구
        val lastComplete = json.lastIndexOf("},")
        if (lastComplete > 0) return json.substring(0, lastComplete + 1) + "]}"
        val lastSingle = json.lastIndexOf("}]}")
        if (lastSingle > 0) return json.substring(0, lastSingle + 3)
        return json
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseComments(jsonText: String): List<ParsedComment> {
        return try {
            val cleanJson = jsonText.trim()
                .removePrefix("```json").removePrefix("```")
                .removeSuffix("```").trim()
                .replace("\\" + "$", "$")  // Claude가 Kotlin 코드에서 \$ 이스케이프 → JSON 비표준, $ 로 치환
            val parsed = try {
                objectMapper.readValue(cleanJson, Map::class.java)
            } catch (e: com.fasterxml.jackson.core.io.JsonEOFException) {
                log.warn("Claude 응답 잘림 감지, 복구 시도")
                objectMapper.readValue(recoverTruncatedJson(cleanJson), Map::class.java)
            }
            val issues = parsed["issues"] as? List<Map<String, Any?>> ?: emptyList()
            issues.mapNotNull { issue ->
                try {
                    ParsedComment(
                        severity = ReviewSeverity.valueOf(issue["severity"] as? String ?: "LOW"),
                        filePath = issue["filePath"] as? String ?: "unknown",
                        lineNumber = (issue["lineNumber"] as? Number)?.toInt(),
                        content = issue["content"] as? String ?: "",
                        suggestion = issue["suggestion"] as? String
                    )
                } catch (e: Exception) {
                    log.warn("이슈 파싱 실패: $issue")
                    null
                }
            }
        } catch (e: Exception) {
            log.warn("Claude 응답 파싱 실패: ${e.message}")
            emptyList()
        }
    }
}

data class ParsedComment(
    val severity: ReviewSeverity,
    val filePath: String,
    val lineNumber: Int?,
    val content: String,
    val suggestion: String?
)

data class ReviewResult(val comments: List<ParsedComment>, val tokensUsed: Int)

data class ApiCallResult(val comments: List<ParsedComment>, val tokensUsed: Int)
