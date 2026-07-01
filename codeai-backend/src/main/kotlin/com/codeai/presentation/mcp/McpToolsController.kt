package com.codeai.presentation.mcp

import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * MCP 도구 목록/스키마 조회 (MCP001 화면용). (IA문서 §4 MCP)
 * 실제 도구 호출은 /mcp (Streamable HTTP) 엔드포인트가 담당하고, 여기서는 메타데이터만 제공한다.
 */
@Tag(name = "MCP", description = "MCP 도구 목록 및 연결 가이드")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/mcp")
class McpToolsController(
    @Value("\${codeai.mcp.endpoint:http://localhost:8080/mcp}") private val endpoint: String,
) {
    @Operation(summary = "노출 중인 MCP 도구 목록 + 스키마")
    @GetMapping("/tools")
    fun getTools(): ApiResponse<McpToolsResponse> = ApiResponse.ok(
        McpToolsResponse(
            serverName = "codi-mcp-server",
            version = "1.0.0",
            endpoint = endpoint,
            transport = "streamable-http",
            tools = TOOLS,
        )
    )

    companion object {
        private val TOOLS = listOf(
            McpToolInfo(
                name = "get_pr_diff",
                description = "PR diff를 가져옵니다. 민감정보(API 키·비밀번호)는 자동 마스킹됩니다.",
                parameters = mapOf(
                    "repoFullName" to McpParamInfo("string", "org/repo 형식"),
                    "prNumber" to McpParamInfo("integer", "PR 번호"),
                ),
            ),
            McpToolInfo(
                name = "post_review_comment",
                description = "PR에 코드리뷰 코멘트를 등록합니다.",
                parameters = mapOf(
                    "repoFullName" to McpParamInfo("string", "org/repo 형식"),
                    "prNumber" to McpParamInfo("integer", "PR 번호"),
                    "severity" to McpParamInfo("string", "심각도", enum = listOf("HIGH", "MEDIUM", "LOW")),
                    "body" to McpParamInfo("string", "코멘트 내용"),
                ),
            ),
            McpToolInfo(
                name = "run_e2e_tests",
                description = "Playwright E2E 테스트를 실행하고 결과를 반환합니다.",
                parameters = mapOf(
                    "ref" to McpParamInfo("string", "브랜치명 또는 커밋 SHA"),
                    "targetUrl" to McpParamInfo("string", "테스트 대상 URL"),
                ),
            ),
            McpToolInfo(
                name = "trigger_deploy",
                description = "HIGH 이슈 0건 + 테스트 통과 조건 충족 시 GitHub Actions 배포를 트리거합니다. 조건 미충족 시 에러 반환.",
                parameters = mapOf(
                    "repoFullName" to McpParamInfo("string", "org/repo 형식"),
                    "ref" to McpParamInfo("string", "브랜치명 또는 커밋 SHA"),
                    "highCount" to McpParamInfo("integer", "HIGH 심각도 이슈 수. 반드시 0이어야 함."),
                    "testsPassed" to McpParamInfo("boolean", "테스트 통과 여부. 반드시 true여야 함."),
                ),
            ),
            McpToolInfo(
                name = "send_notification",
                description = "활성화된 모든 알림 채널(Slack 등)로 메시지를 발송합니다.",
                parameters = mapOf(
                    "title" to McpParamInfo("string", "제목"),
                    "body" to McpParamInfo("string", "본문"),
                    "status" to McpParamInfo("string", "상태", enum = listOf("SUCCESS", "FAILED", "INFO")),
                ),
            ),
            McpToolInfo(
                name = "mask_secrets",
                description = "텍스트에서 API 키·비밀번호·토큰 패턴을 마스킹합니다.",
                parameters = mapOf(
                    "text" to McpParamInfo("string", "마스킹할 원본 텍스트"),
                ),
            ),
        )
    }
}
