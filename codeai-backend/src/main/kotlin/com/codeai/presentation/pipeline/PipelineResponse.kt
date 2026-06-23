package com.codeai.presentation.pipeline

import com.codeai.domain.notification.NotificationMessage
import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.pipeline.PipelineStep
import com.codeai.domain.review.CodeReview
import com.codeai.domain.review.ReviewComment
import com.codeai.domain.testrun.TestRun
import java.time.Duration
import java.time.LocalDateTime

data class PipelineListResponse(
    val content: List<PipelineSummary>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)

data class PipelineSummary(
    val id: Long,
    val repositoryFullName: String,
    val prNumber: Int,
    val prTitle: String,
    val prAuthor: String,
    val status: String,
    val vcsId: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val durationSeconds: Long?
) {
    companion object {
        fun from(e: PipelineExecution, repoFullName: String) = PipelineSummary(
            id = e.id, repositoryFullName = repoFullName,
            prNumber = e.prNumber, prTitle = e.prTitle,
            prAuthor = e.prAuthor, status = e.status.name,
            vcsId = e.vcsId,
            startedAt = e.startedAt, completedAt = e.completedAt,
            durationSeconds = e.durationSeconds
        )
    }
}

data class PipelineDetailResponse(
    val id: Long,
    val repositoryFullName: String,
    val vcsId: String,
    val prNumber: Int,
    val prTitle: String,
    val prUrl: String,
    val prAuthor: String,
    val headSha: String,
    val status: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val steps: List<StepSummary>,
    val review: ReviewSummary?,
    val testRun: TestRunSummary?,
    val notifications: List<NotificationSummary>
)

data class StepSummary(
    val stepType: String,
    val status: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val durationSeconds: Long?,
    val errorMessage: String?
) {
    companion object {
        fun from(s: PipelineStep) = StepSummary(
            stepType = s.stepType.name, status = s.status.name,
            startedAt = s.startedAt, completedAt = s.completedAt,
            durationSeconds = if (s.startedAt != null && s.completedAt != null)
                Duration.between(s.startedAt, s.completedAt).seconds else null,
            errorMessage = s.errorMessage
        )
    }
}

data class ReviewSummary(
    val engineId: String,
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
            engineId = r.engineId,
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

data class TestRunSummary(
    val runnerId: String,
    val status: String,
    val totalTests: Int,
    val passed: Int,
    val failed: Int,
    val coveragePct: Double?
) {
    companion object {
        fun from(t: TestRun) = TestRunSummary(
            runnerId = t.runnerId,
            status = t.status.name, totalTests = t.totalTests,
            passed = t.passed, failed = t.failed, coveragePct = t.coveragePct
        )
    }
}

data class NotificationSummary(
    val channelId: String,
    val status: String,
    val sentAt: LocalDateTime?
) {
    companion object {
        fun from(n: NotificationMessage) = NotificationSummary(
            channelId = n.channelId, status = n.status.name, sentAt = n.sentAt
        )
    }
}

data class PipelineStatsResponse(
    val totalExecutions: Long,
    val successCount: Long,
    val failedCount: Long,
    val successRate: Double,
    val avgDurationSeconds: Long,
    val engineBreakdown: Map<String, Long>,
    val period: String,
    val dailyStats: List<DailyStat>
)

data class DailyStat(
    val date: String,
    val total: Long,
    val success: Long,
    val failed: Long
)
