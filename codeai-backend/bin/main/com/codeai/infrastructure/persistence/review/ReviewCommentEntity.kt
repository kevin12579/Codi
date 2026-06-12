package com.codeai.infrastructure.persistence.review

import com.codeai.domain.review.ReviewComment
import com.codeai.domain.review.ReviewSeverity
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "review_comments")
class ReviewCommentEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "code_review_id", nullable = false)
    val codeReviewId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val severity: ReviewSeverity,

    @Column(name = "file_path", nullable = false)
    val filePath: String,

    @Column(name = "line_number")
    val lineNumber: Int? = null,

    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,

    @Column(columnDefinition = "TEXT")
    val suggestion: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = ReviewComment(
        id = id, codeReviewId = codeReviewId, severity = severity,
        filePath = filePath, lineNumber = lineNumber,
        content = content, suggestion = suggestion, createdAt = createdAt
    )

    companion object {
        fun from(d: ReviewComment) = ReviewCommentEntity(
            id = d.id, codeReviewId = d.codeReviewId, severity = d.severity,
            filePath = d.filePath, lineNumber = d.lineNumber,
            content = d.content, suggestion = d.suggestion, createdAt = d.createdAt
        )
    }
}
