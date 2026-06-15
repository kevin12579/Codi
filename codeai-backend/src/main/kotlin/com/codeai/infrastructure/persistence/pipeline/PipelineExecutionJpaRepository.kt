package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PipelineExecutionJpaRepository : JpaRepository<PipelineExecutionEntity, Long> {

    @Query("""
        SELECT p FROM PipelineExecutionEntity p
        WHERE (:status IS NULL OR p.status = :status)
          AND (:from IS NULL OR p.createdAt >= :from)
          AND (:to IS NULL OR p.createdAt <= :to)
        ORDER BY p.createdAt DESC
    """)
    fun findFiltered(
        @Param("status") status: PipelineStatus?,
        @Param("from") from: LocalDateTime?,
        @Param("to") to: LocalDateTime?,
        pageable: Pageable
    ): Page<PipelineExecutionEntity>

    fun countByStatus(status: PipelineStatus): Long

    fun findTop10ByOrderByCreatedAtDesc(): List<PipelineExecutionEntity>

    @Query("SELECT p FROM PipelineExecutionEntity p WHERE p.completedAt IS NOT NULL AND p.createdAt >= :since ORDER BY p.createdAt ASC")
    fun findCompletedSince(@Param("since") since: LocalDateTime): List<PipelineExecutionEntity>

    fun findFirstByRepositoryIdAndPrNumberAndStatusInOrderByCreatedAtDesc(
        repositoryId: Long,
        prNumber: Int,
        statuses: List<PipelineStatus>
    ): PipelineExecutionEntity?
}
