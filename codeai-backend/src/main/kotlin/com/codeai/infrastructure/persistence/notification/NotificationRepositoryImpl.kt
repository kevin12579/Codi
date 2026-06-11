package com.codeai.infrastructure.persistence.notification

import com.codeai.domain.notification.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository

@Repository
class NotificationRepositoryImpl(
    private val jpa: NotificationJpaRepository
) : NotificationRepository {

    override suspend fun save(message: NotificationMessage): NotificationMessage =
        withContext(Dispatchers.IO) {
            jpa.save(NotificationMessageEntity.from(message)).toDomain()
        }

    override suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): List<NotificationMessage> =
        withContext(Dispatchers.IO) {
            jpa.findByPipelineExecutionId(pipelineExecutionId).map { it.toDomain() }
        }
}
