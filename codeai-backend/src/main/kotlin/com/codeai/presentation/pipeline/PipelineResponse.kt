package com.codeai.presentation.pipeline

import com.codeai.domain.notification.NotificationMessage
import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.review.CodeReview
import com.codeai.domain.review.ReviewComment
import java.time.LocalDateTime

data class PipelineListResponse(
    val content: List<PipelineSummary>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)

data class PipelineSummary(
    val id: Long,
    val prNumber: Int,
    val prTitle: String,
    val prAuthor: String,
    val status: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val durationSeconds: Long?
) {
    companion object {
        fun from(e: PipelineExecution) = PipelineSummary(
            id = e.id, prNumber = e.prNumber, prTitle = e.prTitle,
            prAuthor = e.prAuthor, status = e.status.name,
            startedAt = e.startedAt, completedAt = e.completedAt,
            durationSeconds = e.durationSeconds
        )
    }
}

data class PipelineDetailResponse(
    val id: Long,
    val prNumber: Int,
    val prTitle: String,
    val prUrl: String,
    val prAuthor: String,
    val headSha: String,
    val status: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val review: ReviewSummary?,
    val notifications: List<NotificationSummary>
)

data class ReviewSummary(
    val status: String,
    val promptVersion: String,
    val totalIssues: Int,
    val highCount: Int,
    val mediumCount: Int,
    val lowCount: Int,
    val tokensUsed: Int?,
    val comments: List<CommentSummary>
) {
    companion object {
        fun from(r: CodeReview, comments: List<ReviewComment>) = ReviewSummary(
            status = r.status.name, promptVersion = r.promptVersion,
            totalIssues = r.totalIssues, highCount = r.highCount,
            mediumCount = r.mediumCount, lowCount = r.lowCount,
            tokensUsed = r.tokensUsed,
            comments = comments.map { CommentSummary.from(it) }
        )
    }
}

data class CommentSummary(
    val severity: String,
    val filePath: String,
    val lineNumber: Int?,
    val content: String,
    val suggestion: String?
) {
    companion object {
        fun from(c: ReviewComment) = CommentSummary(
            severity = c.severity.name, filePath = c.filePath,
            lineNumber = c.lineNumber, content = c.content, suggestion = c.suggestion
        )
    }
}

data class NotificationSummary(
    val channel: String,
    val status: String,
    val sentAt: LocalDateTime?
) {
    companion object {
        fun from(n: NotificationMessage) = NotificationSummary(
            channel = n.channel.name, status = n.status.name, sentAt = n.sentAt
        )
    }
}

data class PipelineStatsResponse(
    val totalExecutions: Long,
    val successCount: Long,
    val failedCount: Long,
    val successRate: Double,
    val period: String
)
