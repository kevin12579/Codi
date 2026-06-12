package com.codeai.domain.review

import java.time.LocalDateTime

data class CodeReview(
    val id: Long = 0,
    val pipelineExecutionId: Long,
    val status: ReviewStatus = ReviewStatus.PENDING,
    val promptVersion: String = "v3",
    val totalIssues: Int = 0,
    val highCount: Int = 0,
    val mediumCount: Int = 0,
    val lowCount: Int = 0,
    val tokensUsed: Int? = null,
    val githubCommentId: Long? = null,
    val comments: List<ReviewComment> = emptyList(),
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val completedAt: LocalDateTime? = null
) {
    fun complete(comments: List<ReviewComment>, tokensUsed: Int, githubCommentId: Long?) = copy(
        status = ReviewStatus.COMPLETED,
        comments = comments,
        totalIssues = comments.size,
        highCount = comments.count { it.severity == ReviewSeverity.HIGH },
        mediumCount = comments.count { it.severity == ReviewSeverity.MEDIUM },
        lowCount = comments.count { it.severity == ReviewSeverity.LOW },
        tokensUsed = tokensUsed,
        githubCommentId = githubCommentId,
        completedAt = LocalDateTime.now()
    )

    fun fail() = copy(status = ReviewStatus.FAILED, completedAt = LocalDateTime.now())
}
