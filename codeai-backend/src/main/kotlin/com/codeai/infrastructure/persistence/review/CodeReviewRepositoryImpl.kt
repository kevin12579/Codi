package com.codeai.infrastructure.persistence.review

import com.codeai.domain.review.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class CodeReviewRepositoryImpl(
    private val reviewJpa: CodeReviewJpaRepository,
    private val commentJpa: ReviewCommentJpaRepository
) : CodeReviewRepository {

    override suspend fun save(review: CodeReview): CodeReview =
        withContext(Dispatchers.IO) {
            reviewJpa.save(CodeReviewEntity.from(review)).toDomain()
        }

    override suspend fun saveComment(comment: ReviewComment): ReviewComment =
        withContext(Dispatchers.IO) {
            commentJpa.save(ReviewCommentEntity.from(comment)).toDomain()
        }

    override suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): CodeReview? =
        withContext(Dispatchers.IO) {
            reviewJpa.findByPipelineExecutionId(pipelineExecutionId).orElse(null)?.toDomain()
        }

    override suspend fun findCommentsByReviewId(reviewId: Long): List<ReviewComment> =
        withContext(Dispatchers.IO) {
            commentJpa.findByCodeReviewId(reviewId).map { it.toDomain() }
        }

    override suspend fun countByEngine(): Map<String, Long> =
        withContext(Dispatchers.IO) {
            reviewJpa.countByEngine().associate { row -> (row[0] as String) to (row[1] as Long) }
        }

    override suspend fun countByEngineSince(since: LocalDateTime): Map<String, Long> =
        withContext(Dispatchers.IO) {
            reviewJpa.countByEngineSince(since).associate { row -> (row[0] as String) to (row[1] as Long) }
        }
}
