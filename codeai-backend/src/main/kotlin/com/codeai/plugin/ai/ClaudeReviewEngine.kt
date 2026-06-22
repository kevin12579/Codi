package com.codeai.plugin.ai

import com.codeai.infrastructure.ai.ClaudeApiClient
import com.codeai.infrastructure.ai.ReviewResult
import com.codeai.plugin.spi.AIReviewEngine
import org.springframework.stereotype.Component

/**
 * Claude 리뷰 엔진 — 기존 ClaudeApiClient 를 AIReviewEngine SPI 로 래핑(로직 불변).
 */
@Component
class ClaudeReviewEngine(
    private val client: ClaudeApiClient,
) : AIReviewEngine {
    override val id = "claude"
    override val preferredPromptVersion = "v3"
    override suspend fun review(diff: String, promptVersion: String): ReviewResult =
        client.review(diff, promptVersion)
}
