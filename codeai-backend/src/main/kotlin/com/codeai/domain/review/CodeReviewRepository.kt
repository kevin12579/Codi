package com.codeai.domain.review

interface CodeReviewRepository {
    suspend fun save(review: CodeReview): CodeReview
    suspend fun saveComment(comment: ReviewComment): ReviewComment
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): CodeReview?
    suspend fun findCommentsByReviewId(reviewId: Long): List<ReviewComment>
    /** 엔진별 리뷰 건수 (engineId → count). */
    suspend fun countByEngine(): Map<String, Long>
}
