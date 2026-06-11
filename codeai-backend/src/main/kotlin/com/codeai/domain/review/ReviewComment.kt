package com.codeai.domain.review

import java.time.LocalDateTime

data class ReviewComment(
    val id: Long = 0,
    val codeReviewId: Long = 0,
    val severity: ReviewSeverity,
    val filePath: String,
    val lineNumber: Int? = null,
    val content: String,
    val suggestion: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
