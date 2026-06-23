package com.codeai.mcp

import com.codeai.infrastructure.ai.MaskingUtil
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.plugin.registry.ProviderRegistry
import kotlinx.coroutines.runBlocking
import org.springframework.ai.tool.annotation.Tool
import org.springframework.ai.tool.annotation.ToolParam
import org.springframework.stereotype.Component

/**
 * 코디 MCP 도구 6종 (@Tool). (종합설계 §6-2)
 *
 * spring-ai 1.0.x: @Tool 메서드는 plain 타입을 반환해야 한다.
 * Mono<T>를 반환하면 Jackson이 Reactor 내부 필드만 직렬화하므로 runBlocking으로 suspend 함수를 브리지.
 * spring-ai ASYNC 서버는 TaskExecutor 스레드에서 도구를 실행하므로 runBlocking 교착 위험 없음.
 *
 * 전송: SSE (/sse 엔드포인트) — spring-ai 1.x는 Streamable HTTP 미지원.
 */
@Component
class CodiMcpTools(
    private val registry: ProviderRegistry,
    private val settings: SettingsStore,
) {

    @Tool(description = "PR diff를 가져옵니다. 민감정보(API 키·비밀번호)는 자동 마스킹됩니다.")
    fun getPrDiff(
        @ToolParam(description = "org/repo 형식") repoFullName: String,
        @ToolParam(description = "PR 번호") prNumber: Int,
    ): String = runBlocking {
        val vcs = registry.resolveVcs()
        MaskingUtil.mask(vcs.getDiff(repoFullName, prNumber))
    }

    @Tool(description = "PR에 코드리뷰 코멘트를 등록합니다.")
    fun postReviewComment(
        @ToolParam(description = "org/repo 형식") repoFullName: String,
        @ToolParam(description = "PR 번호") prNumber: Int,
        @ToolParam(description = "심각도 (HIGH|MEDIUM|LOW)") severity: String?,
        @ToolParam(description = "코멘트 내용") body: String,
    ): Map<String, Any?> = runBlocking {
        val vcs = registry.resolveVcs()
        val full = if (severity.isNullOrBlank()) body else "**[$severity]** $body"
        val commentId = vcs.postReviewComment(repoFullName, prNumber, full)
        mapOf("posted" to (commentId != null), "commentId" to commentId)
    }

    @Tool(description = "Playwright E2E 테스트를 실행하고 결과를 반환합니다.")
    fun runE2eTests(
        @ToolParam(description = "브랜치명 또는 커밋 SHA") ref: String?,
        @ToolParam(description = "테스트 대상 URL") targetUrl: String?,
    ): Map<String, Any?> = runBlocking {
        val result = registry.activeRunner().run()
        mapOf(
            "status" to if (result.failed == 0) "PASSED" else "FAILED",
            "totalTests" to result.totalTests,
            "passed" to result.passed,
            "failed" to result.failed,
        )
    }

    @Tool(description = "HIGH 이슈 0건 + 테스트 통과 조건 충족 시 GitHub Actions 배포를 트리거합니다. 조건 미충족 시 에러 반환.")
    fun triggerDeploy(
        @ToolParam(description = "org/repo 형식") repoFullName: String,
        @ToolParam(description = "브랜치명 또는 커밋 SHA") ref: String,
        @ToolParam(description = "HIGH 심각도 이슈 수. 반드시 0이어야 함.") highCount: Int,
        @ToolParam(description = "테스트 통과 여부. 반드시 true여야 함.") testsPassed: Boolean,
    ): Map<String, Any?> = runBlocking {
        require(highCount == 0 && testsPassed) {
            "배포 조건 미충족 (highCount=$highCount, testsPassed=$testsPassed)"
        }
        val triggered = registry.activeDeployer().deploy(repoFullName, ref, mapOf("source" to "mcp"))
        mapOf("triggered" to triggered)
    }

    @Tool(description = "활성화된 모든 알림 채널(Slack 등)로 메시지를 발송합니다.")
    fun sendNotification(
        @ToolParam(description = "제목") title: String,
        @ToolParam(description = "본문") body: String,
        @ToolParam(description = "상태 (SUCCESS|FAILED|INFO)") status: String?,
    ): Map<String, Any?> = runBlocking {
        val url = settings.get("slack.webhook.url")
        if (url.isNullOrBlank()) {
            mapOf("sent" to false, "reason" to "no notification channel configured")
        } else {
            val payload = mapOf<String, Any>("text" to "*$title* (${status ?: "INFO"})\n$body")
            val channels = registry.activeChannels()
            var anySent = false
            for (ch in channels) { anySent = anySent || ch.send(payload, url) }
            mapOf("sent" to anySent)
        }
    }

    @Tool(description = "텍스트에서 API 키·비밀번호·토큰 패턴을 마스킹합니다.")
    fun maskSecrets(
        @ToolParam(description = "마스킹할 원본 텍스트") text: String,
    ): String = MaskingUtil.mask(text)
}
