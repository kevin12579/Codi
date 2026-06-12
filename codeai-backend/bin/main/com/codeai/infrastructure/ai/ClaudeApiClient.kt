package com.codeai.infrastructure.ai

import com.codeai.domain.review.ReviewSeverity
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class ClaudeApiClient(
    @Value("\${claude.api.key}") private val apiKey: String,
    @Value("\${claude.api.max-tokens}") private val maxTokens: Int,
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

    suspend fun review(diff: String, promptVersion: String): ReviewResult {
        val maskedDiff = MaskingUtil.mask(diff)
        val chunks = DiffTokenizer.splitByTokenBudget(maskedDiff, maxTokens)

        val allComments = mutableListOf<ParsedComment>()
        var totalTokens = 0

        for (chunk in chunks) {
            val prompt = ClaudeReviewPrompt.build(chunk, promptVersion)
            val result = callApi(prompt)
            allComments.addAll(result.comments)
            totalTokens += result.tokensUsed
        }

        log.info("Claude 리뷰 완료: ${allComments.size}건, 토큰=${totalTokens}")
        return ReviewResult(allComments, totalTokens)
    }

    private suspend fun callApi(prompt: String): ApiCallResult {
        val requestBody = mapOf(
            "model" to "claude-sonnet-4-20250514",
            "max_tokens" to maxTokens,
            "messages" to listOf(mapOf("role" to "user", "content" to prompt))
        )

        @Suppress("UNCHECKED_CAST")
        val response = webClient.post()
            .uri("/v1/messages")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .awaitSingle() as Map<String, Any?>

        val content = (response["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
        val text = content?.get("text") as? String ?: return ApiCallResult(emptyList(), 0)

        val usage = response["usage"] as? Map<*, *>
        val tokensUsed = ((usage?.get("input_tokens") as? Number)?.toInt() ?: 0) +
                ((usage?.get("output_tokens") as? Number)?.toInt() ?: 0)

        return ApiCallResult(parseComments(text), tokensUsed)
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseComments(jsonText: String): List<ParsedComment> {
        return try {
            val cleanJson = jsonText.trim()
                .removePrefix("```json").removePrefix("```")
                .removeSuffix("```").trim()
            val parsed = objectMapper.readValue(cleanJson, Map::class.java)
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
