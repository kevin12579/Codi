package com.codeai.domain.pipeline

interface PipelineRepository {
    suspend fun save(execution: PipelineExecution): PipelineExecution
    suspend fun findById(id: Long): PipelineExecution?
    suspend fun findAll(
        status: String?,
        from: String?,
        to: String?,
        page: Int,
        size: Int,
        repositoryId: Long? = null
    ): PipelineExecutionPage
    suspend fun countByStatus(status: PipelineStatus, repositoryId: Long? = null): Long
    suspend fun findRecent(limit: Int): List<PipelineExecution>
    suspend fun findCompletedSince(days: Int, repositoryId: Long? = null): List<PipelineExecution>
    suspend fun findActive(repositoryId: Long, prNumber: Int): PipelineExecution?
    /** cutoff 이전에 생성됐는데 아직 진행중(PENDING/RUNNING)인 고아 파이프라인. */
    suspend fun findStale(statuses: List<PipelineStatus>, cutoff: java.time.LocalDateTime): List<PipelineExecution>
}

data class PipelineExecutionPage(
    val content: List<PipelineExecution>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)
