package com.codeai.presentation.audit

import com.codeai.application.audit.AuditLogPageDto
import com.codeai.application.audit.AuditQueryUseCase
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 감사 로그 조회 — ADMIN 전용 (SecurityConfig 에서 강제). (v0.8/0.9 §2-3, D11)
 */
@Tag(name = "감사 로그", description = "접속·행위 이력 조회 (ADMIN)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/audit-logs")
class AuditController(private val auditQueryUseCase: AuditQueryUseCase) {

    @Operation(summary = "감사 로그 조회 (action/actor/from/to 필터)")
    @GetMapping
    suspend fun getAuditLogs(
        @RequestParam(required = false) action: String?,
        @RequestParam(required = false) actorId: Long?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ApiResponse<AuditLogPageDto> =
        ApiResponse.ok(auditQueryUseCase.search(action, actorId, from, to, page, size))
}
