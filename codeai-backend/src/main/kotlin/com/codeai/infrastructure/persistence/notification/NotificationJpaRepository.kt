package com.codeai.infrastructure.persistence.notification

import org.springframework.data.jpa.repository.JpaRepository

interface NotificationJpaRepository : JpaRepository<NotificationMessageEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): List<NotificationMessageEntity>
}
