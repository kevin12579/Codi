package com.codeai.presentation.settings

import com.codeai.application.settings.SettingsUseCase
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

@Tag(name = "설정", description = "GitHub / Slack / Claude API 연동 설정")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/settings")
class SettingsController(private val settingsUseCase: SettingsUseCase) {

    @Operation(summary = "전체 설정 통합 조회")
    @GetMapping
    suspend fun getAll(): ApiResponse<AllSettingsResponse> =
        ApiResponse.ok(settingsUseCase.getAll())

    @Operation(summary = "Slack Webhook URL 조회")
    @GetMapping("/slack")
    suspend fun getSlack(): ApiResponse<SlackSettingsResponse> =
        ApiResponse.ok(settingsUseCase.getSlack())

    @Operation(summary = "Slack Webhook URL 저장")
    @PutMapping("/slack")
    suspend fun updateSlack(@RequestBody req: SlackSettingsRequest): ApiResponse<SlackSettingsResponse> =
        ApiResponse.ok(settingsUseCase.updateSlack(req.webhookUrl), "Slack 설정 저장 완료")

    @Operation(summary = "Slack 테스트 메시지 발송")
    @PostMapping("/slack/test")
    suspend fun testSlack(): ApiResponse<Nothing> {
        settingsUseCase.sendSlackTest()
        return ApiResponse.ok("테스트 메시지 발송 완료")
    }

    @Operation(summary = "Claude API 설정 조회")
    @GetMapping("/claude")
    suspend fun getClaude(): ApiResponse<ClaudeSettingsResponse> =
        ApiResponse.ok(settingsUseCase.getClaude())

    @Operation(summary = "Claude API 설정 저장 (프롬프트 버전, 최대 토큰)")
    @PutMapping("/claude")
    suspend fun updateClaude(@RequestBody req: ClaudeSettingsRequest): ApiResponse<ClaudeSettingsResponse> =
        ApiResponse.ok(settingsUseCase.updateClaude(req.activePromptVersion, req.maxTokensPerReview), "Claude 설정 저장 완료")

    @Operation(summary = "GitHub 연동 레포지토리 목록 및 Webhook URL 조회")
    @GetMapping("/github")
    suspend fun getGithub(): ApiResponse<GithubSettingsResponse> =
        ApiResponse.ok(settingsUseCase.getGithub())

    @Operation(summary = "GitHub Webhook Secret 변경")
    @PutMapping("/github")
    suspend fun updateGithub(@RequestBody req: GithubSettingsRequest): ApiResponse<GithubSettingsResponse> =
        ApiResponse.ok(settingsUseCase.updateGithubSecret(req.webhookSecret), "GitHub Webhook Secret 저장 완료")
}
