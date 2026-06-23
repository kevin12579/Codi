package com.codeai.plugin.spi

import com.codeai.infrastructure.ai.ReviewResult

/**
 * AI 코드리뷰 엔진 SPI. (종합설계 §5-1)
 *
 * V1 구현체: Claude(기본) · OpenAI GPT-4o(P4) · Gemini(P4).
 * ProviderRegistry 가 system_settings 의 `ai.engine` 값으로 런타임 선택한다.
 *
 * 시그니처는 기존 ClaudeApiClient.review(diff, promptVersion) 와 1:1 일치시켜
 * 래퍼가 순수 위임이 되도록 한다(동작 불변 보장).
 */
interface AIReviewEngine {
    val id: String
    /** null이면 전역 codeai.review.prompt-version 사용, 값이 있으면 엔진별 고정 버전 사용. */
    val preferredPromptVersion: String? get() = null
    suspend fun review(diff: String, promptVersion: String): ReviewResult
}
