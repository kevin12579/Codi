package com.codeai.infrastructure.persistence.review

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface CodeReviewJpaRepository : JpaRepository<CodeReviewEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): Optional<CodeReviewEntity>
}

interface ReviewCommentJpaRepository : JpaRepository<ReviewCommentEntity, Long> {
    fun findByCodeReviewId(codeReviewId: Long): List<ReviewCommentEntity>
}
