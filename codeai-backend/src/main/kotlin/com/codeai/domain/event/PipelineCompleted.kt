package com.codeai.domain.event

import java.time.LocalDateTime

data class PipelineCompleted(
    val pipelineExecutionId: Long,
    val success: Boolean,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
