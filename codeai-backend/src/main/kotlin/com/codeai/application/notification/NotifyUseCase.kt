package com.codeai.application.notification

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.event.TestRunCompleted
import com.codeai.domain.notification.NotificationChannel
import com.codeai.domain.notification.NotificationMessage
import com.codeai.domain.notification.NotificationRepository
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.infrastructure.slack.SlackMessageBuilder
import com.codeai.infrastructure.slack.SlackWebhookClient
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class NotifyUseCase(
    private val notificationRepository: NotificationRepository,
    private val slackWebhookClient: SlackWebhookClient,
    private val settingsStore: SettingsStore,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun onReviewCompleted(event: ReviewCompleted) {
        val payload = SlackMessageBuilder.buildReviewMessage(event)
        val messageText = objectMapper.writeValueAsString(payload)

        var notification = notificationRepository.save(
            NotificationMessage(
                pipelineExecutionId = event.pipelineExecutionId,
                channel = NotificationChannel.SLACK,
                message = messageText
            )
        )

        val slackUrl = settingsStore.get("slack.webhook.url") ?: ""
        val sent = slackWebhookClient.send(payload, slackUrl)
        notification = if (sent) {
            notificationRepository.save(notification.markSent())
        } else {
            notificationRepository.save(notification.markFailed("Slack 발송 실패"))
        }

        log.info("Slack 알림 ${if (sent) "발송 완료" else "실패"}: pipelineId=${event.pipelineExecutionId}")
    }

    suspend fun onTestRunCompleted(event: TestRunCompleted) {
        val payload = SlackMessageBuilder.buildTestRunMessage(event)
        val messageText = objectMapper.writeValueAsString(payload)

        var notification = notificationRepository.save(
            NotificationMessage(
                pipelineExecutionId = event.pipelineExecutionId,
                channel = NotificationChannel.SLACK,
                message = messageText
            )
        )

        val slackUrl = settingsStore.get("slack.webhook.url") ?: ""
        val sent = slackWebhookClient.send(payload, slackUrl)
        notification = if (sent) {
            notificationRepository.save(notification.markSent())
        } else {
            notificationRepository.save(notification.markFailed("Slack 발송 실패"))
        }

        log.info("테스트 결과 Slack 알림 ${if (sent) "발송 완료" else "실패"}: pipelineId=${event.pipelineExecutionId}")
    }
}
