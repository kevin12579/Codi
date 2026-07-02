package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PipelineExecutionJpaRepository : JpaRepository<PipelineExecutionEntity, Long>, JpaSpecificationExecutor<PipelineExecutionEntity> {

    fun countByStatus(status: PipelineStatus): Long
    fun countByStatusAndRepositoryId(status: PipelineStatus, repositoryId: Long): Long

    fun findTop10ByOrderByCreatedAtDesc(): List<PipelineExecutionEntity>

    @Query("SELECT p FROM PipelineExecutionEntity p WHERE p.completedAt IS NOT NULL AND p.createdAt >= :since ORDER BY p.createdAt ASC")
    fun findCompletedSince(@Param("since") since: LocalDateTime): List<PipelineExecutionEntity>

    @Query("SELECT p FROM PipelineExecutionEntity p WHERE p.completedAt IS NOT NULL AND p.createdAt >= :since AND p.repositoryId = :repositoryId ORDER BY p.createdAt ASC")
    fun findCompletedSinceAndRepository(@Param("since") since: LocalDateTime, @Param("repositoryId") repositoryId: Long): List<PipelineExecutionEntity>

    fun findFirstByRepositoryIdAndPrNumberAndStatusInOrderByCreatedAtDesc(
        repositoryId: Long,
        prNumber: Int,
        statuses: List<PipelineStatus>
    ): PipelineExecutionEntity?

    fun countByStatusAndCreatedAtAfter(status: PipelineStatus, since: LocalDateTime): Long

    fun findByCreatedAtBetweenOrderByCreatedAtAsc(
        from: LocalDateTime,
        to: LocalDateTime
    ): List<PipelineExecutionEntity>

    /** 특정 상태(PENDING/RUNNING)로 오래 멈춘 고아 파이프라인 회수용. */
    fun findByStatusInAndCreatedAtBefore(
        statuses: List<PipelineStatus>,
        cutoff: LocalDateTime
    ): List<PipelineExecutionEntity>
}
