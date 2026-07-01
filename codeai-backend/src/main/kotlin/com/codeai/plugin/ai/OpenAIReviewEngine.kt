package com.codeai.plugin.ai

import com.codeai.infrastructure.ai.ApiCallResult
import com.codeai.infrastructure.connector.ConnectorConfigService
import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException

/**
 * OpenAI GPT-4o 리뷰 엔진 (AIReviewEngine SPI, id="openai"). (종합설계 §8-1)
 * 공통 프롬프트/파싱은 AbstractHttpReviewEngine, 여기서는 chat/completions 호출만 구현.
 *
 * 키 우선순위: 커넥터 저장 키(AES 복호화) → 없으면 env(openai.api.key). 재배포 없이 즉시 적용.
 */
@Component
class OpenAIReviewEngine(
    @Value("\${openai.api.key:}") private val envApiKey: String,
    @Value("\${openai.api.model:gpt-4o}") private val model: String,
    @Value("\${openai.api.max-tokens:2000}") maxTokens: Int,
    @Value("\${openai.api.max-chunks:10}") maxChunks: Int,
    private val connectorConfig: ConnectorConfigService,
) : AbstractHttpReviewEngine(maxTokens, maxChunks) {

    override val id = "openai"

    private val webClient = WebClient.builder()
        .baseUrl("https://api.openai.com")
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    override suspend fun callModel(prompt: String): ApiCallResult {
        val apiKey = connectorConfig.getApiKey("ai", id) ?: envApiKey
        if (apiKey.isBlank()) {
            log.warn("[openai] API 키 미설정 — 빈 결과 반환")
            return ApiCallResult(emptyList(), 0)
        }
        @Suppress("UNCHECKED_CAST")
        val response = try {
            webClient.post()
                .uri("/v1/chat/completions")
                .header("Authorization", "Bearer $apiKey")
                .header("Content-Type", "application/json")
                .bodyValue(
                    mapOf(
                        "model" to model,
                        "max_tokens" to maxTokens,
                        "messages" to listOf(mapOf("role" to "user", "content" to prompt)),
                    )
                )
                .retrieve()
                .bodyToMono(Map::class.java)
                .awaitSingle() as Map<String, Any?>
        } catch (e: WebClientResponseException) {
            log.error("[openai] API 에러 - 상태: ${e.statusCode}, 본문: ${e.responseBodyAsString}")
            throw e
        }

        val choices = response["choices"] as? List<*>
        val message = (choices?.firstOrNull() as? Map<*, *>)?.get("message") as? Map<*, *>
        val text = message?.get("content") as? String ?: return ApiCallResult(emptyList(), 0)

        val usage = response["usage"] as? Map<*, *>
        val tokens = (usage?.get("total_tokens") as? Number)?.toInt() ?: 0

        log.info("[openai] 원본 응답 (앞500자): {}", text.take(500))
        return ApiCallResult(parseComments(text), tokens)
    }
}
