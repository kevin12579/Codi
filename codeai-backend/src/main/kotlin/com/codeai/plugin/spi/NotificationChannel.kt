package com.codeai.plugin.spi

/**
 * 알림 채널 SPI. (종합설계 §5-1)
 *
 * V1 구현체: Slack(레퍼런스 1종). Discord/Teams 등은 V2.
 *
 * ⚠️ 이름 충돌 주의: 도메인의 `com.codeai.domain.notification.NotificationChannel` 은
 * enum(SLACK/GITHUB) 으로 별개 개념이다. 본 SPI 는 `com.codeai.plugin.spi` 패키지로 분리하여
 * FQN 으로 구분한다.
 *
 * 시그니처는 기존 SlackWebhookClient.send(payload, webhookUrl) 와 1:1 일치(동작 불변).
 */
interface NotificationChannel {
    val id: String
    suspend fun send(payload: Map<String, Any>, webhookUrl: String): Boolean
}
