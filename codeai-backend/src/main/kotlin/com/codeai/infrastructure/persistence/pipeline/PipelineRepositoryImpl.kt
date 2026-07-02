package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.*
import jakarta.persistence.criteria.Predicate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Repository
class PipelineRepositoryImpl(
    private val jpa: PipelineExecutionJpaRepository
) : PipelineRepository {

    private val dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    override suspend fun save(execution: PipelineExecution): PipelineExecution =
        withContext(Dispatchers.IO) {
            jpa.save(PipelineExecutionEntity.from(execution)).toDomain()
        }

    override suspend fun findById(id: Long): PipelineExecution? =
        withContext(Dispatchers.IO) {
            jpa.findById(id).orElse(null)?.toDomain()
        }

    override suspend fun findAll(
        status: String?, from: String?, to: String?, page: Int, size: Int, repositoryId: Long?
    ): PipelineExecutionPage = withContext(Dispatchers.IO) {
        val statusEnum = status?.let { PipelineStatus.valueOf(it) }
        val fromDt = from?.let { LocalDate.parse(it, dateFmt).atStartOfDay() }
        val toDt = to?.let { LocalDate.parse(it, dateFmt).atTime(23, 59, 59) }

        // PostgreSQL이 null 파라미터 타입을 추론 못하는 문제 방지: null 조건은 WHERE절에서 제외
        val spec = Specification<PipelineExecutionEntity> { root, _, cb ->
            val predicates = mutableListOf<Predicate>()
            statusEnum?.let { predicates.add(cb.equal(root.get<PipelineStatus>("status"), it)) }
            fromDt?.let { predicates.add(cb.greaterThanOrEqualTo(root.get<LocalDateTime>("createdAt"), it)) }
            toDt?.let { predicates.add(cb.lessThanOrEqualTo(root.get<LocalDateTime>("createdAt"), it)) }
            repositoryId?.let { predicates.add(cb.equal(root.get<Long>("repositoryId"), it)) }
            if (predicates.isEmpty()) null else cb.and(*predicates.toTypedArray())
        }
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val result = jpa.findAll(spec, pageable)
        PipelineExecutionPage(
            content = result.content.map { it.toDomain() },
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            currentPage = page
        )
    }

    override suspend fun countByStatus(status: PipelineStatus, repositoryId: Long?): Long =
        withContext(Dispatchers.IO) {
            if (repositoryId != null) jpa.countByStatusAndRepositoryId(status, repositoryId)
            else jpa.countByStatus(status)
        }

    override suspend fun findRecent(limit: Int): List<PipelineExecution> =
        withContext(Dispatchers.IO) {
            jpa.findTop10ByOrderByCreatedAtDesc().map { it.toDomain() }
        }

    override suspend fun findCompletedSince(days: Int, repositoryId: Long?): List<PipelineExecution> =
        withContext(Dispatchers.IO) {
            val since = java.time.LocalDateTime.now().minusDays(days.toLong())
            if (repositoryId != null) jpa.findCompletedSinceAndRepository(since, repositoryId).map { it.toDomain() }
            else jpa.findCompletedSince(since).map { it.toDomain() }
        }

    override suspend fun findActive(repositoryId: Long, prNumber: Int): PipelineExecution? =
        withContext(Dispatchers.IO) {
            jpa.findFirstByRepositoryIdAndPrNumberAndStatusInOrderByCreatedAtDesc(
                repositoryId,
                prNumber,
                listOf(PipelineStatus.PENDING, PipelineStatus.RUNNING)
            )?.toDomain()
        }

    override suspend fun findStale(statuses: List<PipelineStatus>, cutoff: LocalDateTime): List<PipelineExecution> =
        withContext(Dispatchers.IO) {
            jpa.findByStatusInAndCreatedAtBefore(statuses, cutoff).map { it.toDomain() }
        }
}
