package com.codeai.domain.review

import java.time.LocalDateTime

interface CodeReviewRepository {
    suspend fun save(review: CodeReview): CodeReview
    suspend fun saveComment(comment: ReviewComment): ReviewComment
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): CodeReview?
    suspend fun findCommentsByReviewId(reviewId: Long): List<ReviewComment>
    /** 엔진별 리뷰 건수 (engineId → count). */
    suspend fun countByEngine(): Map<String, Long>
    /** 특정 시점 이후 엔진별 리뷰 건수 (engineId → count). */
    suspend fun countByEngineSince(since: LocalDateTime): Map<String, Long>
}
