package com.codeai.application.pipeline

import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.pipeline.PipelineStatus
import com.codeai.presentation.pipeline.PipelineStatsResponse
import org.springframework.stereotype.Service
import kotlin.math.roundToInt

@Service
class PipelineStatsUseCase(
    private val pipelineRepository: PipelineRepository
) {
    suspend fun getStats(period: String): PipelineStatsResponse {
        val successCount = pipelineRepository.countByStatus(PipelineStatus.SUCCESS)
        val failedCount = pipelineRepository.countByStatus(PipelineStatus.FAILED)
        val runningCount = pipelineRepository.countByStatus(PipelineStatus.RUNNING)
        val pendingCount = pipelineRepository.countByStatus(PipelineStatus.PENDING)
        val total = successCount + failedCount + runningCount + pendingCount
        val successRate = if (total > 0) (successCount.toDouble() / total * 1000).roundToInt() / 10.0 else 0.0

        return PipelineStatsResponse(
            totalExecutions = total,
            successCount = successCount,
            failedCount = failedCount,
            successRate = successRate,
            period = period
        )
    }
}
