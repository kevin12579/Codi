package com.codeai.domain.pipeline

import java.time.LocalDateTime

data class PipelineStep(
    val id: Long = 0,
    val pipelineExecutionId: Long,
    val stepType: StepType,
    val status: StepStatus = StepStatus.PENDING,
    val startedAt: LocalDateTime? = null,
    val completedAt: LocalDateTime? = null,
    val errorMessage: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun start() = copy(status = StepStatus.RUNNING, startedAt = LocalDateTime.now())
    fun succeed() = copy(status = StepStatus.SUCCESS, completedAt = LocalDateTime.now())
    fun fail(error: String) = copy(status = StepStatus.FAILED, errorMessage = error, completedAt = LocalDateTime.now())
    fun skip() = copy(status = StepStatus.SKIPPED, completedAt = LocalDateTime.now())
}
