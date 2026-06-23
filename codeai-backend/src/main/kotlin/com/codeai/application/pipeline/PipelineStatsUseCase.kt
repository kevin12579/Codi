package com.codeai.application.pipeline

import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.pipeline.PipelineStatus
import com.codeai.domain.review.CodeReviewRepository
import com.codeai.infrastructure.cache.PipelineCacheService
import com.codeai.presentation.pipeline.DailyStat
import com.codeai.presentation.pipeline.PipelineStatsResponse
import org.springframework.stereotype.Service
import kotlin.math.roundToInt

@Service
class PipelineStatsUseCase(
    private val pipelineRepository: PipelineRepository,
    private val reviewRepository: CodeReviewRepository,
    private val cache: PipelineCacheService
) {
    suspend fun getStats(period: String, repositoryId: Long? = null): PipelineStatsResponse {
        val key = PipelineCacheService.statsKey(repositoryId, period)
        return cache.getOrLoad(key, PipelineStatsResponse::class.java) {
            val days = when (period) { "30d" -> 30; "90d" -> 90; else -> 7 }

            val completed = pipelineRepository.findCompletedSince(days, repositoryId)
            val successCount = completed.count { it.status == PipelineStatus.SUCCESS }.toLong()
            val failedCount = completed.count { it.status == PipelineStatus.FAILED }.toLong()
            val total = completed.size.toLong()
            val successRate = if (total > 0) (successCount.toDouble() / total * 1000).roundToInt() / 10.0 else 0.0

            val avgDuration = completed.mapNotNull { it.durationSeconds }.let { durations ->
                if (durations.isEmpty()) 0L else durations.average().toLong()
            }

            val dailyStats = completed.groupBy {
                it.createdAt.toLocalDate().toString()
            }.map { (date, items) ->
                DailyStat(
                    date = date,
                    total = items.size.toLong(),
                    success = items.count { it.status == PipelineStatus.SUCCESS }.toLong(),
                    failed = items.count { it.status == PipelineStatus.FAILED }.toLong()
                )
            }.sortedBy { it.date }

            PipelineStatsResponse(
                totalExecutions = total,
                successCount = successCount,
                failedCount = failedCount,
                successRate = successRate,
                avgDurationSeconds = avgDuration,
                engineBreakdown = reviewRepository.countByEngine(),
                period = period,
                dailyStats = dailyStats
            )
        }
    }
}
