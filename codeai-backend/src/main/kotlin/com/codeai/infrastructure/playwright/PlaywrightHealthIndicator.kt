package com.codeai.infrastructure.playwright

import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.ReactiveHealthIndicator
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import java.time.Duration

/**
 * /actuator/health 의 `playwright` 컴포넌트. (IA문서 §health 예시)
 *
 * - 비활성(enabled=false): UP(disabled) — dev 환경에서 playwright-server 미기동이어도 헬스 정상.
 * - 활성(enabled=true): playwright-server 도달 가능하면 UP, 연결 실패면 DOWN(명시적 활성화했으므로 정상 의미).
 */
@Component
class PlaywrightHealthIndicator(
    @Value("\${playwright.enabled:false}") private val enabled: Boolean,
    @Value("\${playwright.server.url:http://playwright-server:3001}") private val serverUrl: String,
) : ReactiveHealthIndicator {

    private val webClient = WebClient.builder().build()

    override fun health(): Mono<Health> {
        if (!enabled) {
            return Mono.just(Health.up().withDetail("playwright", "disabled").build())
        }
        // exchangeToMono: 4xx/5xx 응답도 "도달함=UP" 으로 처리(연결 실패만 DOWN).
        return webClient.get()
            .uri("$serverUrl/health")
            .exchangeToMono { resp ->
                Mono.just(
                    Health.up()
                        .withDetail("server", serverUrl)
                        .withDetail("httpStatus", resp.statusCode().value())
                        .build()
                )
            }
            .timeout(Duration.ofSeconds(2))
            .onErrorResume {
                Mono.just(
                    Health.down()
                        .withDetail("server", serverUrl)
                        .withDetail("error", it.message ?: "unreachable")
                        .build()
                )
            }
    }
}
