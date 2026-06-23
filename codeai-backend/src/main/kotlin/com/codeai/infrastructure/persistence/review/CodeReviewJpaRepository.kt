package com.codeai.infrastructure.persistence.review

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface CodeReviewJpaRepository : JpaRepository<CodeReviewEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): Optional<CodeReviewEntity>

    @Query("SELECT c.engineId, COUNT(c) FROM CodeReviewEntity c GROUP BY c.engineId")
    fun countByEngine(): List<Array<Any>>
}

interface ReviewCommentJpaRepository : JpaRepository<ReviewCommentEntity, Long> {
    fun findByCodeReviewId(codeReviewId: Long): List<ReviewCommentEntity>
}
