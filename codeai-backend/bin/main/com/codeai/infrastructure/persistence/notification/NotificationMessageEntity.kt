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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val channel: NotificationChannel,

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
        channel = channel, message = message, status = status,
        sentAt = sentAt, errorMessage = errorMessage, createdAt = createdAt
    )

    companion object {
        fun from(d: NotificationMessage) = NotificationMessageEntity(
            id = d.id, pipelineExecutionId = d.pipelineExecutionId,
            channel = d.channel, message = d.message, status = d.status,
            sentAt = d.sentAt, errorMessage = d.errorMessage, createdAt = d.createdAt
        )
    }
}
