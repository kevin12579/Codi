package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.pipeline.PipelineStatus
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "pipeline_executions")
class PipelineExecutionEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "repository_id", nullable = false)
    val repositoryId: Long,

    @Column(name = "vcs_id", nullable = false)
    val vcsId: String = "github",

    @Column(name = "pr_number", nullable = false)
    val prNumber: Int,

    @Column(name = "pr_title", nullable = false)
    val prTitle: String,

    @Column(name = "pr_url", nullable = false)
    val prUrl: String,

    @Column(name = "pr_author", nullable = false)
    val prAuthor: String,

    @Column(name = "head_sha", nullable = false)
    val headSha: String,

    @Column(name = "head_branch")
    val headBranch: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PipelineStatus = PipelineStatus.PENDING,

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null,

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = PipelineExecution(
        id = id, repositoryId = repositoryId, vcsId = vcsId,
        prNumber = prNumber, prTitle = prTitle, prUrl = prUrl,
        prAuthor = prAuthor, headSha = headSha, headBranch = headBranch,
        status = status, startedAt = startedAt, completedAt = completedAt,
        createdAt = createdAt
    )

    companion object {
        fun from(d: PipelineExecution) = PipelineExecutionEntity(
            id = d.id, repositoryId = d.repositoryId, vcsId = d.vcsId,
            prNumber = d.prNumber, prTitle = d.prTitle, prUrl = d.prUrl,
            prAuthor = d.prAuthor, headSha = d.headSha, headBranch = d.headBranch,
            status = d.status, startedAt = d.startedAt, completedAt = d.completedAt,
            createdAt = d.createdAt
        )
    }
}
