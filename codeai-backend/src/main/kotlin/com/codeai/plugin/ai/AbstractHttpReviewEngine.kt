package com.codeai.plugin.ai

import com.codeai.domain.review.ReviewSeverity
import com.codeai.infrastructure.ai.ApiCallResult
import com.codeai.infrastructure.ai.ClaudeReviewPrompt
import com.codeai.infrastructure.ai.DiffTokenizer
import com.codeai.infrastructure.ai.MaskingUtil
import com.codeai.infrastructure.ai.ParsedComment
import com.codeai.infrastructure.ai.ReviewResult
import com.codeai.plugin.spi.AIReviewEngine
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory

/**
 * HTTP 기반 AI 리뷰 엔진 공통 베이스 (OpenAI·Gemini 공용). (종합설계 §8)
 *
 * 리뷰 파이프라인(diff 필터 → 마스킹 → 청크 분할 → 프롬프트 → 파싱 → 집계)은 엔진 무관하게 동일하므로
 * 여기서 공유하고, 엔진별로 다른 부분(`callModel`: 실제 API 호출)만 하위 클래스가 구현한다.
 *
 * Claude 는 기존 ClaudeApiClient(검증된 경로)를 그대로 두므로 본 베이스를 사용하지 않는다(회귀 회피).
 * 프롬프트·심각도 기준은 ClaudeReviewPrompt(v3)로 3종 엔진 공통(설계 §8-3).
 */
abstract class AbstractHttpReviewEngine(
    protected val maxTokens: Int,
    private val maxChunks: Int,
) : AIReviewEngine {

    protected val log = LoggerFactory.getLogger(this::class.java)

    private val excludedPrefixes = listOf("bin/", "build/", ".gradle/", ".idea/", "out/", "target/")

    // 비표준 이스케이프(코드 스니펫의 \$ 등) 허용 — Claude 파서와 동일 정책.
    private val lenientMapper =
        ObjectMapper().configure(JsonParser.Feature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER, true)

    override suspend fun review(diff: String, promptVersion: String): ReviewResult {
        val filtered = filterDiff(diff)
        val masked = MaskingUtil.mask(filtered)
        val chunks = DiffTokenizer.splitByTokenBudget(masked, maxTokens).take(maxChunks)

        val allComments = mutableListOf<ParsedComment>()
        var totalTokens = 0
        for (chunk in chunks) {
            val prompt = ClaudeReviewPrompt.build(chunk, promptVersion)
            val result = callModel(prompt)
            allComments.addAll(result.comments)
            totalTokens += result.tokensUsed
        }
        log.info("[$id] 리뷰 완료: ${allComments.size}건, 토큰=$totalTokens")
        return ReviewResult(allComments, totalTokens)
    }

    /** 엔진별 API 1회 호출. 응답 텍스트를 parseComments 로 파싱해 ApiCallResult 로 반환한다. */
    protected abstract suspend fun callModel(prompt: String): ApiCallResult

    private fun filterDiff(diff: String): String {
        val sections = diff.split(Regex("(?=\\ndiff --git )"))
        return sections.filter { section ->
            excludedPrefixes.none { prefix ->
                section.contains("diff --git a/$prefix") || section.contains("diff --git b/$prefix")
            }
        }.joinToString("")
    }

    @Suppress("UNCHECKED_CAST")
    protected fun parseComments(jsonText: String): List<ParsedComment> {
        return try {
            val cleanJson = jsonText.trim()
                .removePrefix("```json").removePrefix("```")
                .removeSuffix("```").trim()
            val parsed = try {
                lenientMapper.readValue(cleanJson, Map::class.java)
            } catch (e: com.fasterxml.jackson.core.io.JsonEOFException) {
                log.warn("[$id] 응답 잘림 감지, 복구 시도")
                lenientMapper.readValue(recoverTruncatedJson(cleanJson), Map::class.java)
            }
            val issues = parsed["issues"] as? List<Map<String, Any?>> ?: emptyList()
            issues.mapNotNull { issue ->
                try {
                    ParsedComment(
                        severity = ReviewSeverity.valueOf(issue["severity"] as? String ?: "LOW"),
                        filePath = issue["filePath"] as? String ?: "unknown",
                        lineNumber = (issue["lineNumber"] as? Number)?.toInt(),
                        content = issue["content"] as? String ?: "",
                        suggestion = issue["suggestion"] as? String,
                    )
                } catch (e: Exception) {
                    null
                }
            }
        } catch (e: Exception) {
            log.warn("[$id] 응답 파싱 실패: ${e.message}")
            emptyList()
        }
    }

    private fun recoverTruncatedJson(json: String): String {
        val lastComplete = json.lastIndexOf("},")
        if (lastComplete > 0) return json.substring(0, lastComplete + 1) + "]}"
        val lastSingle = json.lastIndexOf("}]}")
        if (lastSingle > 0) return json.substring(0, lastSingle + 3)
        return json
    }
}
