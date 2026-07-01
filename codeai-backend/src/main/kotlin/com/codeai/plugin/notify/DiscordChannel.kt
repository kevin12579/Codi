package com.codeai.plugin.notify

import com.codeai.infrastructure.discord.DiscordWebhookClient
import com.codeai.plugin.spi.NotificationChannel
import org.springframework.stereotype.Component

/**
 * Discord 알림 채널 — 2번째 NotificationChannel 구현체 (v0.9 V1-B 도전, §1-3).
 * "인터페이스만으론 확장성 아님 → 2번째 구현체로 실증" 의 증거.
 * notify.channels 설정에 'discord' 가 포함되면 ProviderRegistry.activeChannels() 가 선택한다.
 */
@Component
class DiscordChannel(
    private val client: DiscordWebhookClient,
) : NotificationChannel {
    override val id = "discord"
    override suspend fun send(payload: Map<String, Any>, webhookUrl: String): Boolean =
        client.send(payload, webhookUrl)
}
