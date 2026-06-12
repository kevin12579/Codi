package com.codeai.domain.event

import java.time.LocalDateTime

data class TestRunCompleted(
    val pipelineExecutionId: Long,
    val testRunId: Long,
    val passed: Boolean,
    val totalTests: Int,
    val failedCount: Int,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
