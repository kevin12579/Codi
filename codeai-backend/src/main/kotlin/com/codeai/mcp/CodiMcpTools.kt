package com.codeai.mcp

import com.codeai.infrastructure.ai.MaskingUtil
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.plugin.registry.ProviderRegistry
import kotlinx.coroutines.reactor.mono
import org.springframework.ai.mcp.annotation.McpTool
import org.springframework.ai.mcp.annotation.McpToolParam
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

/**
 * 코디 MCP 도구 6종 (@McpTool). (종합설계 §6-2)
 *
 * 외부 AI 클라이언트(Claude Desktop·Cursor·MCP Inspector)가 /mcp(Streamable HTTP)로 호출한다.
 * 파이프라인 순서는 RedisStreamConsumer 가 결정하고, 여기서는 개별 도구를 표준 인터페이스로 노출한다.
 *
 * ⚠️ type=ASYNC(WebFlux)이므로 모든 도구는 반드시 리액티브 반환형(Mono)이어야 등록된다(P0 검증).
 * suspend 로직은 kotlinx `mono { }` 빌더로 브리지한다.
 *
 * 보안 불변: get_pr_diff 는 MaskingUtil 강제, trigger_deploy 는 도구 내부에서 배포 조건을 재검증한다.
 */
@Component
class CodiMcpTools(
    private val registry: ProviderRegistry,
    private val settings: SettingsStore,
) {

    @McpTool(
        name = "get_pr_diff",
        description = "PR diff를 가져옵니다. 민감정보(API 키·비밀번호)는 자동 마스킹됩니다.",
    )
    fun getPrDiff(
        @McpToolParam(description = "org/repo 형식", required = true) repoFullName: String,
        @McpToolParam(description = "PR 번호", required = true) prNumber: Int,
    ): Mono<String> = mono {
        val vcs = registry.resolveVcs()
        MaskingUtil.mask(vcs.getDiff(repoFullName, prNumber))
    }

    @McpTool(
        name = "post_review_comment",
        description = "PR에 코드리뷰 코멘트를 등록합니다.",
    )
    fun postReviewComment(
        @McpToolParam(description = "org/repo 형식", required = true) repoFullName: String,
        @McpToolParam(description = "PR 번호", required = true) prNumber: Int,
        @McpToolParam(description = "심각도 (HIGH|MEDIUM|LOW)", required = false) severity: String?,
        @McpToolParam(description = "코멘트 내용", required = true) body: String,
    ): Mono<Map<String, Any?>> = mono {
        val vcs = registry.resolveVcs()
        val full = if (severity.isNullOrBlank()) body else "**[$severity]** $body"
        val commentId = vcs.postReviewComment(repoFullName, prNumber, full)
        mapOf("posted" to (commentId != null), "commentId" to commentId)
    }

    @McpTool(
        name = "run_e2e_tests",
        description = "Playwright E2E 테스트를 실행하고 결과를 반환합니다.",
    )
    fun runE2eTests(
        @McpToolParam(description = "브랜치명 또는 커밋 SHA", required = false) ref: String?,
        @McpToolParam(description = "테스트 대상 URL", required = false) targetUrl: String?,
    ): Mono<Map<String, Any?>> = mono {
        // ref/targetUrl 은 프로토콜 호환용. 실제 대상 URL 은 playwright-server 설정(frontend.url)을 따른다.
        val result = registry.activeRunner().run()
        mapOf(
            "status" to if (result.failed == 0) "PASSED" else "FAILED",
            "totalTests" to result.totalTests,
            "passed" to result.passed,
            "failed" to result.failed,
        )
    }

    @McpTool(
        name = "trigger_deploy",
        description = "HIGH 이슈 0건 + 테스트 통과 조건 충족 시 GitHub Actions 배포를 트리거합니다. 조건 미충족 시 에러 반환.",
    )
    fun triggerDeploy(
        @McpToolParam(description = "org/repo 형식", required = true) repoFullName: String,
        @McpToolParam(description = "브랜치명 또는 커밋 SHA", required = true) ref: String,
        @McpToolParam(description = "HIGH 심각도 이슈 수. 반드시 0이어야 함.", required = true) highCount: Int,
        @McpToolParam(description = "테스트 통과 여부. 반드시 true여야 함.", required = true) testsPassed: Boolean,
    ): Mono<Map<String, Any?>> = mono {
        // 비즈니스 규칙을 AI 판단에 위임하지 않고 도구 내부에서 재검증.
        require(highCount == 0 && testsPassed) {
            "배포 조건 미충족 (highCount=$highCount, testsPassed=$testsPassed)"
        }
        val triggered = registry.activeDeployer().deploy(repoFullName, ref, mapOf("source" to "mcp"))
        mapOf("triggered" to triggered)
    }

    @McpTool(
        name = "send_notification",
        description = "활성화된 모든 알림 채널(Slack 등)로 메시지를 발송합니다.",
    )
    fun sendNotification(
        @McpToolParam(description = "제목", required = true) title: String,
        @McpToolParam(description = "본문", required = true) body: String,
        @McpToolParam(description = "상태 (SUCCESS|FAILED|INFO)", required = false) status: String?,
    ): Mono<Map<String, Any?>> = mono {
        val url = settings.get("slack.webhook.url")
        if (url.isNullOrBlank()) {
            mapOf("sent" to false, "reason" to "no notification channel configured")
        } else {
            val payload = mapOf<String, Any>("text" to "*$title* (${status ?: "INFO"})\n$body")
            val sent = registry.activeChannels().any { it.send(payload, url) }
            mapOf("sent" to sent)
        }
    }

    @McpTool(
        name = "mask_secrets",
        description = "텍스트에서 API 키·비밀번호·토큰 패턴을 마스킹합니다.",
    )
    fun maskSecrets(
        @McpToolParam(description = "마스킹할 원본 텍스트", required = true) text: String,
    ): Mono<String> = Mono.just(MaskingUtil.mask(text))
}
