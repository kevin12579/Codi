package com.codeai.infrastructure.slack

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.event.TestRunCompleted

object SlackMessageBuilder {

    fun buildTestRunMessage(event: TestRunCompleted): Map<String, Any> {
        val status = if (event.passed) "✅ 테스트 통과" else "❌ 테스트 실패 (${event.failedCount}건)"
        val color = if (event.passed) "#36a64f" else "#ff0000"
        return mapOf(
            "text" to "코디(Code AI) 테스트 완료",
            "attachments" to listOf(
                mapOf(
                    "color" to color,
                    "fields" to listOf(
                        mapOf("title" to "상태", "value" to status, "short" to true),
                        mapOf("title" to "전체", "value" to event.totalTests.toString(), "short" to true),
                        mapOf("title" to "실패", "value" to event.failedCount.toString(), "short" to true),
                        mapOf("title" to "pipelineId", "value" to event.pipelineExecutionId.toString(), "short" to true)
                    )
                )
            )
        )
    }

    fun buildReviewMessage(event: ReviewCompleted): Map<String, Any> {
        val isClean = event.highCount == 0
        val status = if (isClean) "✅ 리뷰 통과" else "⚠️ HIGH 이슈 ${event.highCount}건"
        val color = if (isClean) "#36a64f" else "#ff0000"

        return mapOf(
            "text" to "코디(Code AI) 코드리뷰 완료: *${event.prTitle}*",
            "attachments" to listOf(
                mapOf(
                    "color" to color,
                    "fields" to listOf(
                        mapOf("title" to "상태", "value" to status, "short" to true),
                        mapOf("title" to "HIGH", "value" to event.highCount.toString(), "short" to true),
                        mapOf("title" to "MEDIUM", "value" to event.mediumCount.toString(), "short" to true),
                        mapOf("title" to "LOW", "value" to event.lowCount.toString(), "short" to true),
                        mapOf("title" to "PR 링크", "value" to event.prUrl, "short" to false)
                    )
                )
            )
        )
    }
}
