package com.codeai.infrastructure.slack

import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class SlackWebhookClient(
    @Value("\${slack.webhook.url}") private val webhookUrl: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val webClient = WebClient.builder().build()

    suspend fun send(payload: Map<String, Any>): Boolean =
        try {
            webClient.post()
                .uri(webhookUrl)
                .bodyValue(payload)
                .retrieve()
                .toBodilessEntity()
                .awaitSingle()
            true
        } catch (e: Exception) {
            log.error("Slack 메시지 발송 실패: ${e.message}")
            false
        }
}
