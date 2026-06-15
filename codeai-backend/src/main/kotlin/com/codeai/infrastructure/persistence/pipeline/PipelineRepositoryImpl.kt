package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDate
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
        status: String?, from: String?, to: String?, page: Int, size: Int
    ): PipelineExecutionPage = withContext(Dispatchers.IO) {
        val statusEnum = status?.let { PipelineStatus.valueOf(it) }
        val fromDt = from?.let { LocalDate.parse(it, dateFmt).atStartOfDay() }
        val toDt = to?.let { LocalDate.parse(it, dateFmt).atTime(23, 59, 59) }
        val result = jpa.findFiltered(statusEnum, fromDt, toDt, PageRequest.of(page, size))
        PipelineExecutionPage(
            content = result.content.map { it.toDomain() },
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            currentPage = page
        )
    }

    override suspend fun countByStatus(status: PipelineStatus): Long =
        withContext(Dispatchers.IO) { jpa.countByStatus(status) }

    override suspend fun findRecent(limit: Int): List<PipelineExecution> =
        withContext(Dispatchers.IO) {
            jpa.findTop10ByOrderByCreatedAtDesc().map { it.toDomain() }
        }

    override suspend fun findCompletedSince(days: Int): List<PipelineExecution> =
        withContext(Dispatchers.IO) {
            val since = java.time.LocalDateTime.now().minusDays(days.toLong())
            jpa.findCompletedSince(since).map { it.toDomain() }
        }

    override suspend fun findActive(repositoryId: Long, prNumber: Int): PipelineExecution? =
        withContext(Dispatchers.IO) {
            jpa.findFirstByRepositoryIdAndPrNumberAndStatusInOrderByCreatedAtDesc(
                repositoryId,
                prNumber,
                listOf(PipelineStatus.PENDING, PipelineStatus.RUNNING)
            )?.toDomain()
        }
}
