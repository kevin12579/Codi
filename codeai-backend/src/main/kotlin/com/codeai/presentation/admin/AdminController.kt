package com.codeai.presentation.admin

import com.codeai.application.admin.AdminStatsDto
import com.codeai.application.admin.AdminUseCase
import com.codeai.application.admin.HourlyStatDto
import com.codeai.application.admin.UserLogDto
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "관리자", description = "ADMIN 역할 전용 — 대시보드 통계, 파이프라인 추이, 행위 이력")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/admin")
class AdminController(private val adminUseCase: AdminUseCase) {

    @GetMapping("/stats")
    suspend fun getStats(): ApiResponse<AdminStatsDto> =
        ApiResponse.ok(adminUseCase.getStats())

    @GetMapping("/pipeline-hourly")
    suspend fun getPipelineHourly(): ApiResponse<List<HourlyStatDto>> =
        ApiResponse.ok(adminUseCase.getPipelineHourly())

    @GetMapping("/user-logs")
    suspend fun getUserLogs(): ApiResponse<List<UserLogDto>> =
        ApiResponse.ok(adminUseCase.getUserLogs())
}
