package com.codeai.domain.notification

import java.time.LocalDateTime

data class NotificationMessage(
    val id: Long = 0,
    val pipelineExecutionId: Long,
    val channelId: String,       // 설계 §3: 소문자 플러그인 ID ("slack", "discord", "teams")
    val message: String,
    val status: NotificationStatus = NotificationStatus.PENDING,
    val sentAt: LocalDateTime? = null,
    val errorMessage: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun markSent() = copy(status = NotificationStatus.SENT, sentAt = LocalDateTime.now())
    fun markFailed(error: String) = copy(status = NotificationStatus.FAILED, errorMessage = error)
}
