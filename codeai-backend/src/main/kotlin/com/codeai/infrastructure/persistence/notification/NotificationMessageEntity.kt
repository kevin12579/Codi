package com.codeai.infrastructure.persistence.notification

import com.codeai.domain.notification.*
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "notification_messages")
class NotificationMessageEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "pipeline_execution_id", nullable = false)
    val pipelineExecutionId: Long,

    @Column(name = "channel_id", nullable = false)
    val channelId: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val message: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: NotificationStatus = NotificationStatus.PENDING,

    @Column(name = "sent_at")
    var sentAt: LocalDateTime? = null,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = NotificationMessage(
        id = id, pipelineExecutionId = pipelineExecutionId,
        channelId = channelId, message = message, status = status,
        sentAt = sentAt, errorMessage = errorMessage, createdAt = createdAt
    )

    companion object {
        fun from(d: NotificationMessage) = NotificationMessageEntity(
            id = d.id, pipelineExecutionId = d.pipelineExecutionId,
            channelId = d.channelId, message = d.message, status = d.status,
            sentAt = d.sentAt, errorMessage = d.errorMessage, createdAt = d.createdAt
        )
    }
}
