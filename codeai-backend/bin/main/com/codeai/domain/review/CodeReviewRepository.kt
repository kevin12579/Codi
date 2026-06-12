package com.codeai.domain.review

interface CodeReviewRepository {
    suspend fun save(review: CodeReview): CodeReview
    suspend fun saveComment(comment: ReviewComment): ReviewComment
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): CodeReview?
    suspend fun findCommentsByReviewId(reviewId: Long): List<ReviewComment>
}
