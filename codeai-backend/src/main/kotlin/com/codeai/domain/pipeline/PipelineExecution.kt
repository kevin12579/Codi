package com.codeai.domain.pipeline

import java.time.LocalDateTime

data class PipelineExecution(
    val id: Long = 0,
    val repositoryId: Long,
    val prNumber: Int,
    val prTitle: String,
    val prUrl: String,
    val prAuthor: String,
    val headSha: String,
    val status: PipelineStatus = PipelineStatus.PENDING,
    val startedAt: LocalDateTime? = null,
    val completedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun start() = copy(status = PipelineStatus.RUNNING, startedAt = LocalDateTime.now())
    fun complete() = copy(status = PipelineStatus.SUCCESS, completedAt = LocalDateTime.now())
    fun fail() = copy(status = PipelineStatus.FAILED, completedAt = LocalDateTime.now())

    val durationSeconds: Long?
        get() = if (startedAt != null && completedAt != null)
            java.time.Duration.between(startedAt, completedAt).seconds
        else null
}
