package com.codeai.application.notification

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.event.TestRunCompleted
import com.codeai.domain.notification.NotificationChannel
import com.codeai.domain.notification.NotificationMessage
import com.codeai.domain.notification.NotificationRepository
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.infrastructure.slack.SlackMessageBuilder
import com.codeai.plugin.registry.ProviderRegistry
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class NotifyUseCase(
    private val notificationRepository: NotificationRepository,
    private val registry: ProviderRegistry,
    private val settingsStore: SettingsStore,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun onReviewCompleted(event: ReviewCompleted) =
        sendSlack(
            pipelineExecutionId = event.pipelineExecutionId,
            payload = SlackMessageBuilder.buildReviewMessage(event),
            logTag = "Slack 알림"
        )

    suspend fun onTestRunCompleted(event: TestRunCompleted) =
        sendSlack(
            pipelineExecutionId = event.pipelineExecutionId,
            payload = SlackMessageBuilder.buildTestRunMessage(event),
            logTag = "테스트 결과 Slack 알림"
        )

    private suspend fun sendSlack(pipelineExecutionId: Long, payload: Map<String, Any>, logTag: String) {
        val slackUrl = settingsStore.get("slack.webhook.url")
        if (slackUrl.isNullOrBlank()) {
            log.warn("$logTag 스킵: Slack Webhook URL 미설정 (pipelineId=$pipelineExecutionId)")
            notificationRepository.save(
                NotificationMessage(
                    pipelineExecutionId = pipelineExecutionId,
                    channel = NotificationChannel.SLACK,
                    message = objectMapper.writeValueAsString(payload)
                ).markFailed("Slack Webhook URL 미설정")
            )
            return
        }

        val notification = notificationRepository.save(
            NotificationMessage(
                pipelineExecutionId = pipelineExecutionId,
                channel = NotificationChannel.SLACK,
                message = objectMapper.writeValueAsString(payload)
            )
        )

        // V1: notify.channels 미시드 시 폴백으로 Slack 단일 채널. send 위임은 기존과 동일.
        val sent = registry.activeChannels().firstOrNull()?.send(payload, slackUrl) ?: false
        notificationRepository.save(
            if (sent) notification.markSent()
            else notification.markFailed("Slack 발송 실패")
        )

        log.info("$logTag ${if (sent) "발송 완료" else "실패"}: pipelineId=$pipelineExecutionId")
    }
}
