package com.codeai.domain.event

import java.time.LocalDateTime

data class PipelineStarted(
    val pipelineExecutionId: Long,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
