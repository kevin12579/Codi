package com.codeai.application.notification

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.event.TestRunCompleted
import com.codeai.domain.notification.NotificationChannelId
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

    /** v0.9(D10): 배포 후보 표시 시 Slack 으로 '관리자 승인 요청' 알림 */
    suspend fun notifyDeployCandidate(pipelineExecutionId: Long, prTitle: String, repoFullName: String) =
        sendSlack(
            pipelineExecutionId = pipelineExecutionId,
            payload = mapOf(
                "text" to "🚀 *배포 후보* — `$repoFullName` : *$prTitle*\nHIGH 0건·테스트 통과. 대시보드에서 관리자(ADMIN) 승인 시 배포됩니다."
            ),
            logTag = "배포 후보 Slack 알림"
        )

    private suspend fun sendSlack(pipelineExecutionId: Long, payload: Map<String, Any>, logTag: String) {
        // v0.9: 활성 채널 전부에 각자의 webhook URL 로 발송 (slack + V1-B 도전 discord).
        val channels = registry.activeChannels()
        val notification = notificationRepository.save(
            NotificationMessage(
                pipelineExecutionId = pipelineExecutionId,
                channelId = NotificationChannelId.SLACK,
                message = objectMapper.writeValueAsString(payload)
            )
        )

        var anySent = false
        var anyConfigured = false
        for (channel in channels) {
            // 채널별 webhook URL (slack.webhook.url / discord.webhook.url). slack 은 기존 키 폴백.
            val url = settingsStore.get("${channel.id}.webhook.url")
                ?: settingsStore.get("slack.webhook.url").takeIf { channel.id == "slack" }
            if (url.isNullOrBlank()) {
                log.warn("$logTag 스킵: ${channel.id} Webhook URL 미설정 (pipelineId=$pipelineExecutionId)")
                continue
            }
            anyConfigured = true
            if (channel.send(payload, url)) anySent = true
        }

        notificationRepository.save(
            if (anySent) notification.markSent()
            else notification.markFailed(if (anyConfigured) "알림 발송 실패" else "알림 Webhook URL 미설정")
        )
        log.info("$logTag ${if (anySent) "발송 완료" else "실패/스킵"}: pipelineId=$pipelineExecutionId")
    }
}
