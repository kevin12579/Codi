package com.codeai.infrastructure.discord

import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

/**
 * Discord Incoming Webhook 클라이언트 (v0.9 V1-B 도전 — 2번째 알림 구현체).
 * Slack 과 payload 포맷이 달라(Discord 는 `content`) Slack 스타일 payload 를 변환한다.
 */
@Component
class DiscordWebhookClient {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val webClient = WebClient.builder().build()

    suspend fun send(payload: Map<String, Any>, webhookUrl: String): Boolean {
        if (webhookUrl.isBlank()) {
            log.warn("Discord webhook URL이 설정되지 않았습니다.")
            return false
        }
        val content = extractContent(payload)
        return try {
            webClient.post()
                .uri(webhookUrl)
                .bodyValue(mapOf("content" to content))
                .retrieve()
                .toBodilessEntity()
                .awaitSingle()
            true
        } catch (e: Exception) {
            log.error("Discord 메시지 발송 실패: ${e.message}")
            false
        }
    }

    /** Slack 스타일 payload 에서 Discord 용 텍스트 추출(없으면 직렬화 폴백). */
    private fun extractContent(payload: Map<String, Any>): String {
        (payload["text"] as? String)?.let { if (it.isNotBlank()) return it }
        return payload.toString()
    }
}
