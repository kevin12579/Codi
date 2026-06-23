package com.codeai.plugin.spi

import com.codeai.infrastructure.playwright.PlaywrightResult

/**
 * E2E 테스트 러너 SPI. (종합설계 §5-1)
 *
 * V1 구현체: Playwright. P1 에서는 기존 JVM 내부 실행(PlaywrightRunner)을 그대로 위임하고,
 * P3 에서 전용 컨테이너 HTTP 호출(PlaywrightRunnerClient)로 교체한다(반환형 PlaywrightResult 유지).
 */
interface TestRunner {
    val id: String
    suspend fun run(testFilter: String? = null): PlaywrightResult
}
