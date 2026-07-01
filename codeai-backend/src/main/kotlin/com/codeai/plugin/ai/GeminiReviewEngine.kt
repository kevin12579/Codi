package com.codeai.plugin.ai

import com.codeai.infrastructure.ai.ApiCallResult
import com.codeai.infrastructure.connector.ConnectorConfigService
import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException

/**
 * Google Gemini 1.5 Flash 리뷰 엔진 (AIReviewEngine SPI, id="gemini"). (종합설계 §8-1)
 * 공통 프롬프트/파싱은 AbstractHttpReviewEngine, 여기서는 generateContent 호출만 구현.
 *
 * 키 우선순위: 커넥터 저장 키(AES 복호화) → 없으면 env(gemini.api.key). 재배포 없이 즉시 적용.
 */
@Component
class GeminiReviewEngine(
    @Value("\${gemini.api.key:}") private val envApiKey: String,
    @Value("\${gemini.api.model:gemini-1.5-flash}") private val model: String,
    @Value("\${gemini.api.max-tokens:2000}") maxTokens: Int,
    @Value("\${gemini.api.max-chunks:10}") maxChunks: Int,
    private val connectorConfig: ConnectorConfigService,
) : AbstractHttpReviewEngine(maxTokens, maxChunks) {

    override val id = "gemini"

    private val webClient = WebClient.builder()
        .baseUrl("https://generativelanguage.googleapis.com")
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    override suspend fun callModel(prompt: String): ApiCallResult {
        val apiKey = connectorConfig.getApiKey("ai", id) ?: envApiKey
        if (apiKey.isBlank()) {
            log.warn("[gemini] API 키 미설정 — 빈 결과 반환")
            return ApiCallResult(emptyList(), 0)
        }
        @Suppress("UNCHECKED_CAST")
        val response = try {
            webClient.post()
                .uri("/v1beta/models/$model:generateContent?key=$apiKey")
                .header("Content-Type", "application/json")
                .bodyValue(
                    mapOf(
                        "contents" to listOf(mapOf("parts" to listOf(mapOf("text" to prompt)))),
                        "generationConfig" to mapOf("maxOutputTokens" to maxTokens),
                    )
                )
                .retrieve()
                .bodyToMono(Map::class.java)
                .awaitSingle() as Map<String, Any?>
        } catch (e: WebClientResponseException) {
            log.error("[gemini] API 에러 - 상태: ${e.statusCode}, 본문: ${e.responseBodyAsString}")
            throw e
        }

        val candidates = response["candidates"] as? List<*>
        val content = (candidates?.firstOrNull() as? Map<*, *>)?.get("content") as? Map<*, *>
        val parts = content?.get("parts") as? List<*>
        val text = (parts?.firstOrNull() as? Map<*, *>)?.get("text") as? String
            ?: return ApiCallResult(emptyList(), 0)

        val usage = response["usageMetadata"] as? Map<*, *>
        val tokens = (usage?.get("totalTokenCount") as? Number)?.toInt() ?: 0

        return ApiCallResult(parseComments(text), tokens)
    }
}
