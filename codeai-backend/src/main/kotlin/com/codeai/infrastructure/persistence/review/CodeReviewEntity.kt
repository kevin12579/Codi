package com.codeai.infrastructure.persistence.review

import com.codeai.domain.review.CodeReview
import com.codeai.domain.review.ReviewStatus
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "code_reviews")
class CodeReviewEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "pipeline_execution_id", nullable = false, unique = true)
    val pipelineExecutionId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ReviewStatus = ReviewStatus.PENDING,

    @Column(name = "engine_id", nullable = false)
    var engineId: String = "claude",

    @Column(name = "prompt_version", nullable = false)
    var promptVersion: String = "v3",

    @Column(name = "total_issues", nullable = false)
    var totalIssues: Int = 0,

    @Column(name = "high_count", nullable = false)
    var highCount: Int = 0,

    @Column(name = "medium_count", nullable = false)
    var mediumCount: Int = 0,

    @Column(name = "low_count", nullable = false)
    var lowCount: Int = 0,

    @Column(name = "tokens_used")
    var tokensUsed: Int? = null,

    @Column(name = "github_comment_id")
    var githubCommentId: Long? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null
) {
    fun toDomain() = CodeReview(
        id = id, pipelineExecutionId = pipelineExecutionId,
        status = status, engineId = engineId, promptVersion = promptVersion,
        totalIssues = totalIssues, highCount = highCount,
        mediumCount = mediumCount, lowCount = lowCount,
        tokensUsed = tokensUsed, githubCommentId = githubCommentId,
        createdAt = createdAt, completedAt = completedAt
    )

    companion object {
        fun from(d: CodeReview) = CodeReviewEntity(
            id = d.id, pipelineExecutionId = d.pipelineExecutionId,
            status = d.status, engineId = d.engineId, promptVersion = d.promptVersion,
            totalIssues = d.totalIssues, highCount = d.highCount,
            mediumCount = d.mediumCount, lowCount = d.lowCount,
            tokensUsed = d.tokensUsed, githubCommentId = d.githubCommentId,
            createdAt = d.createdAt, completedAt = d.completedAt
        )
    }
}
