package com.codeai.domain.notification

interface NotificationRepository {
    suspend fun save(message: NotificationMessage): NotificationMessage
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): List<NotificationMessage>
}
