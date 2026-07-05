package com.codeai.application.notification

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.event.TestRunCompleted
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
        sendNotifications(
            pipelineExecutionId = event.pipelineExecutionId,
            payload = SlackMessageBuilder.buildReviewMessage(event),
            logTag = "Slack 알림"
        )

    suspend fun onTestRunCompleted(event: TestRunCompleted) =
        sendNotifications(
            pipelineExecutionId = event.pipelineExecutionId,
            payload = SlackMessageBuilder.buildTestRunMessage(event),
            logTag = "테스트 결과 Slack 알림"
        )

    /** v0.9(D10): 배포 후보 표시 시 Slack 으로 '관리자 승인 요청' 알림 */
    suspend fun notifyDeployCandidate(pipelineExecutionId: Long, prTitle: String, repoFullName: String) =
        sendNotifications(
            pipelineExecutionId = pipelineExecutionId,
            payload = mapOf(
                "text" to "🚀 *배포 후보* — `$repoFullName` : *$prTitle*\nHIGH 0건·테스트 통과. 대시보드에서 관리자(ADMIN) 승인 시 배포됩니다."
            ),
            logTag = "배포 후보 Slack 알림"
        )

    private suspend fun sendNotifications(pipelineExecutionId: Long, payload: Map<String, Any>, logTag: String) {
        // v0.9: 활성 채널 전부에 각자의 webhook URL 로 발송 (slack + V1-B 도전 discord).
        val channels = registry.activeChannels()
        if (channels.isEmpty()) {
            log.warn("$logTag 스킵: 활성 알림 채널 없음 (pipelineId=$pipelineExecutionId)")
            return
        }
        val messageJson = objectMapper.writeValueAsString(payload)

        var anySent = false
        for (channel in channels) {
            // 채널별 webhook URL (slack.webhook.url / discord.webhook.url). slack 은 기존 키 폴백.
            val url = settingsStore.get("${channel.id}.webhook.url")
                ?: settingsStore.get("slack.webhook.url").takeIf { channel.id == "slack" }

            // 이력은 '실제 발송 채널' 기준으로 채널별 1행 저장 (과거: 항상 SLACK 하드코딩되던 버그 수정)
            val notification = notificationRepository.save(
                NotificationMessage(
                    pipelineExecutionId = pipelineExecutionId,
                    channelId = channel.id,
                    message = messageJson
                )
            )

            if (url.isNullOrBlank()) {
                log.warn("$logTag 스킵: ${channel.id} Webhook URL 미설정 (pipelineId=$pipelineExecutionId)")
                notificationRepository.save(notification.markFailed("Webhook URL 미설정"))
                continue
            }

            val ok = channel.send(payload, url)
            notificationRepository.save(if (ok) notification.markSent() else notification.markFailed("알림 발송 실패"))
            if (ok) anySent = true
        }

        log.info("$logTag ${if (anySent) "발송 완료" else "실패/스킵"}: pipelineId=$pipelineExecutionId")
    }
}
