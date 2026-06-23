package com.codeai.infrastructure.playwright

import com.codeai.domain.testrun.TestResult
import com.codeai.plugin.spi.TestRunner
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.reactor.awaitSingle
import kotlinx.coroutines.withTimeout
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

/**
 * Playwright E2E 테스트를 전용 컨테이너(playwright-server, Node.js)에 HTTP 로 위임한다. (종합설계 §7)
 *
 * P1 의 JVM 내부 실행(PlaywrightRunner)을 대체하는 TestRunner SPI 구현체(id="playwright").
 * ProviderRegistry 가 test.runner=playwright 로 선택한다.
 *
 * 회귀 안전장치: `playwright.enabled=false`(기본) 시 기존과 동일하게 테스트를 스킵하고
 * 빈 결과(failed=0)를 반환한다 → TestRun 은 PASSED 처리(기존 동작 보존).
 * 실제 실행은 playwright-server 기동 후 `PLAYWRIGHT_ENABLED=true` 로 활성화한다.
 */
@Component
class PlaywrightRunnerClient(
    @Value("\${playwright.enabled:false}") private val enabled: Boolean,
    @Value("\${playwright.server.url:http://playwright-server:3001}") private val serverUrl: String,
    @Value("\${frontend.url:http://frontend:80}") private val frontendUrl: String,
    @Value("\${playwright.timeout-ms:300000}") private val timeoutMs: Long,
) : TestRunner {

    override val id = "playwright"

    private val log = LoggerFactory.getLogger(this::class.java)
    private val webClient = WebClient.builder()
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    override suspend fun run(testFilter: String?): PlaywrightResult {
        if (!enabled) {
            log.info("Playwright 비활성화 (PLAYWRIGHT_ENABLED=false) — 테스트 스킵")
            return PlaywrightResult(totalTests = 0, passed = 0, failed = 0, skipped = 0, cases = emptyList())
        }

        log.info("Playwright 실행 요청: server=$serverUrl, targetUrl=$frontendUrl, filter=$testFilter")
        return try {
            withTimeout(timeoutMs) {
                webClient.post()
                    .uri("$serverUrl/run")
                    .bodyValue(
                        mapOf(
                            "targetUrl" to frontendUrl,
                            "testFilter" to (testFilter ?: "")
                        )
                    )
                    .retrieve()
                    .bodyToMono(PlaywrightResultDto::class.java)
                    .awaitSingle()
                    .toDomain()
            }
        } catch (e: TimeoutCancellationException) {
            log.error("Playwright 타임아웃: ${timeoutMs}ms 초과 — FAILED 처리")
            PlaywrightResult(totalTests = 0, passed = 0, failed = 1, skipped = 0, cases = emptyList())
        } catch (e: Exception) {
            log.error("playwright-server 호출 실패: ${e.message} — FAILED 처리")
            PlaywrightResult(totalTests = 0, passed = 0, failed = 1, skipped = 0, cases = emptyList())
        }
    }
}

/** playwright-server /run 응답 매핑 DTO. (종합설계 §7-2) */
@JsonIgnoreProperties(ignoreUnknown = true)
data class PlaywrightResultDto(
    val status: String? = null,
    val totalTests: Int = 0,
    val passed: Int = 0,
    val failed: Int = 0,
    val skipped: Int = 0,
    val coveragePct: Double? = null,
    val cases: List<PlaywrightCaseDto> = emptyList(),
) {
    fun toDomain(): PlaywrightResult = PlaywrightResult(
        totalTests = if (totalTests > 0) totalTests else passed + failed + skipped,
        passed = passed,
        failed = failed,
        skipped = skipped,
        cases = cases.map {
            ParsedTestCase(
                name = it.name,
                status = parseStatus(it.status),
                durationMs = it.durationMs,
                errorMessage = it.errorMessage,
            )
        },
    )

    private fun parseStatus(s: String?): TestResult = when (s?.uppercase()) {
        "PASSED" -> TestResult.PASSED
        "FAILED" -> TestResult.FAILED
        else -> TestResult.SKIPPED
    }
}

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlaywrightCaseDto(
    val name: String = "",
    val status: String = "PASSED",
    val durationMs: Int? = null,
    val errorMessage: String? = null,
)
