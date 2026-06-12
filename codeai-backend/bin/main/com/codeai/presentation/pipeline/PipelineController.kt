package com.codeai.presentation.pipeline

import com.codeai.application.pipeline.PipelineQueryUseCase
import com.codeai.application.pipeline.PipelineStatsUseCase
import com.codeai.presentation.common.ApiResponse
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/pipelines")
class PipelineController(
    private val pipelineQueryUseCase: PipelineQueryUseCase,
    private val pipelineStatsUseCase: PipelineStatsUseCase
) {
    @GetMapping
    suspend fun getList(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<PipelineListResponse> {
        val result = pipelineQueryUseCase.getList(status, from, to, page, size.coerceAtMost(100))
        return ApiResponse.ok(result)
    }

    @GetMapping("/stats")
    suspend fun getStats(
        @RequestParam(defaultValue = "7d") period: String
    ): ApiResponse<PipelineStatsResponse> {
        val result = pipelineStatsUseCase.getStats(period)
        return ApiResponse.ok(result)
    }

    @GetMapping("/{id}")
    suspend fun getDetail(
        @PathVariable id: Long
    ): ApiResponse<PipelineDetailResponse> {
        val result = pipelineQueryUseCase.getDetail(id)
        return ApiResponse.ok(result)
    }
}
