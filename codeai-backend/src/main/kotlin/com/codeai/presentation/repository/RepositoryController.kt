package com.codeai.presentation.repository

import com.codeai.application.repository.RepositoryUseCase
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@Tag(name = "레포지토리", description = "연동된 GitHub 레포지토리 조회 / 등록 / 활성 토글")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/repositories")
class RepositoryController(
    private val repositoryUseCase: RepositoryUseCase,
    @Value("\${codeai.webhook.callback-url:http://localhost:8080/webhook/github}") private val webhookCallbackUrl: String
) {
    @Operation(summary = "레포지토리 목록 조회")
    @GetMapping
    suspend fun getRepositories(): ApiResponse<RepositoryListResponse> {
        val repos = repositoryUseCase.findAll()
        return ApiResponse.ok(
            RepositoryListResponse(
                content = repos.map { RepositoryResponse.from(it, webhookCallbackUrl) },
                totalElements = repos.size
            )
        )
    }

    @Operation(summary = "레포지토리 등록 + Webhook URL·Secret 발급 (ADMIN)")
    @PostMapping
    suspend fun register(
        @RequestBody request: RepositoryRegisterRequest
    ): ResponseEntity<ApiResponse<*>> {
        val result = try {
            repositoryUseCase.register(request.fullName, request.url, request.defaultBranch)
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.fail("REPO_INVALID", e.message ?: "잘못된 레포 정보"))
        }
        val body = ApiResponse.ok(
            RepositoryRegisterResponse.from(
                result.repository, webhookCallbackUrl, result.webhookSecret, result.alreadyExists
            ),
            if (result.alreadyExists) "이미 등록된 레포지토리입니다" else "레포지토리를 등록했습니다"
        )
        val status = if (result.alreadyExists) HttpStatus.OK else HttpStatus.CREATED
        return ResponseEntity.status(status).body(body)
    }

    @Operation(summary = "레포지토리 활성/비활성 토글 (ADMIN)")
    @PatchMapping("/{id}")
    suspend fun toggle(
        @PathVariable id: Long,
        @RequestBody request: RepositoryToggleRequest
    ): ResponseEntity<ApiResponse<*>> {
        val updated = repositoryUseCase.toggleActive(id, request.isActive)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("REPO_NOT_FOUND", "레포지토리를 찾을 수 없습니다"))
        return ResponseEntity.ok(
            ApiResponse.ok(
                RepositoryResponse.from(updated, webhookCallbackUrl),
                if (request.isActive) "활성화했습니다" else "비활성화했습니다"
            )
        )
    }
}
