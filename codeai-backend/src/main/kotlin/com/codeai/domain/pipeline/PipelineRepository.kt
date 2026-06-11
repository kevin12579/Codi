package com.codeai.domain.pipeline

interface PipelineRepository {
    suspend fun save(execution: PipelineExecution): PipelineExecution
    suspend fun findById(id: Long): PipelineExecution?
    suspend fun findAll(
        status: String?,
        from: String?,
        to: String?,
        page: Int,
        size: Int
    ): PipelineExecutionPage
    suspend fun countByStatus(status: PipelineStatus): Long
    suspend fun findRecent(limit: Int): List<PipelineExecution>
}

data class PipelineExecutionPage(
    val content: List<PipelineExecution>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)
