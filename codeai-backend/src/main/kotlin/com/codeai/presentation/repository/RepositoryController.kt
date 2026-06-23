package com.codeai.presentation.repository

import com.codeai.application.repository.RepositoryUseCase
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "레포지토리", description = "연동된 GitHub 레포지토리 목록 조회")
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
}
