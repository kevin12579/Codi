package com.codeai.plugin.notify

import com.codeai.infrastructure.slack.SlackWebhookClient
import com.codeai.plugin.spi.NotificationChannel
import org.springframework.stereotype.Component

/**
 * Slack 알림 채널 — 기존 SlackWebhookClient 를 NotificationChannel SPI 로 래핑(로직 불변).
 */
@Component
class SlackChannel(
    private val client: SlackWebhookClient,
) : NotificationChannel {
    override val id = "slack"
    override suspend fun send(payload: Map<String, Any>, webhookUrl: String): Boolean =
        client.send(payload, webhookUrl)
}
