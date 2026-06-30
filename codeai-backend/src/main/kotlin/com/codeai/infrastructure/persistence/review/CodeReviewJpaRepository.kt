package com.codeai.infrastructure.persistence.review

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime
import java.util.Optional

interface CodeReviewJpaRepository : JpaRepository<CodeReviewEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): Optional<CodeReviewEntity>

    @Query("SELECT c.engineId, COUNT(c) FROM CodeReviewEntity c GROUP BY c.engineId")
    fun countByEngine(): List<Array<Any>>

    @Query("SELECT c.engineId, COUNT(c) FROM CodeReviewEntity c WHERE c.createdAt >= :since GROUP BY c.engineId")
    fun countByEngineSince(@Param("since") since: LocalDateTime): List<Array<Any>>
}

interface ReviewCommentJpaRepository : JpaRepository<ReviewCommentEntity, Long> {
    fun findByCodeReviewId(codeReviewId: Long): List<ReviewCommentEntity>
}
