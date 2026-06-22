package com.codeai.presentation.connector

import com.codeai.application.connector.ConnectorUseCase
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

/**
 * 커넥터(플러그인) API — AI 엔진/알림/VCS/테스트/배포 런타임 설정. (IA문서 §4)
 * category: ai | notify | vcs | test | deploy
 */
@Tag(name = "커넥터", description = "플러그인 커넥터 설정 (AI 엔진 교체 등)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/connectors")
class ConnectorController(private val useCase: ConnectorUseCase) {

    @Operation(summary = "전체 커넥터 상태 조회")
    @GetMapping
    suspend fun getAll(): ApiResponse<Map<String, ConnectorCategoryDto>> =
        ApiResponse.ok(useCase.getAll())

    @Operation(summary = "카테고리별 커넥터 조회 (키 값 미반환)")
    @GetMapping("/{category}")
    suspend fun getCategory(@PathVariable category: String): ApiResponse<ConnectorCategoryDetailDto> =
        ApiResponse.ok(useCase.getCategory(category))

    @Operation(summary = "플러그인 선택 + 키 저장 (AES-256)")
    @PutMapping("/{category}")
    suspend fun update(
        @PathVariable category: String,
        @RequestBody req: ConnectorUpdateRequest,
    ): ApiResponse<ConnectorUpdateResultDto> {
        val result = useCase.update(category, req.activeProviders, req.config)
        val message = when (category) {
            "ai" -> "AI 엔진 변경 완료 (다음 파이프라인부터 적용)"
            "notify" -> "알림 채널 변경 완료"
            else -> "커넥터 설정 저장 완료"
        }
        return ApiResponse.ok(result, message)
    }

    @Operation(summary = "커넥터 연결 테스트")
    @PostMapping("/{category}/test")
    suspend fun test(@PathVariable category: String): ApiResponse<Any> = when (category) {
        "ai" -> ApiResponse.ok(useCase.testAi(), "AI 엔진 연결 테스트 성공")
        "notify" -> ApiResponse.ok(useCase.testNotify(), "Slack 테스트 메시지 발송 완료")
        else -> ApiResponse.ok(useCase.testStatic(category), "연결 테스트 성공")
    }
}
