package com.codeai.domain.pipeline

import java.time.LocalDateTime

data class PipelineExecution(
    val id: Long = 0,
    val repositoryId: Long,
    val vcsId: String = "github",
    val prNumber: Int,
    val prTitle: String,
    val prUrl: String,
    val prAuthor: String,
    val headSha: String,
    val headBranch: String? = null,
    val status: PipelineStatus = PipelineStatus.PENDING,
    val startedAt: LocalDateTime? = null,
    val completedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun start() = copy(status = PipelineStatus.RUNNING, startedAt = LocalDateTime.now())
    fun complete() = copy(status = PipelineStatus.SUCCESS, completedAt = LocalDateTime.now())
    fun fail() = copy(status = PipelineStatus.FAILED, completedAt = LocalDateTime.now())

    /** v0.9(D10): 배포 조건 충족 → 자동 배포 대신 '배포 후보'로 표시, ADMIN 승인 대기 */
    fun markDeployCandidate() =
        copy(status = PipelineStatus.DEPLOY_CANDIDATE, completedAt = LocalDateTime.now())

    val durationSeconds: Long?
        get() = if (startedAt != null && completedAt != null)
            java.time.Duration.between(startedAt, completedAt).seconds
        else null
}
