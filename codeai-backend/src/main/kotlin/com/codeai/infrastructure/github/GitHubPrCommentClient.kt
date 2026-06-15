package com.codeai.infrastructure.github

import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class GitHubPrCommentClient(
    @Value("\${github.token}") private val token: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    private val webClient = WebClient.builder()
        .baseUrl("https://api.github.com")
        .defaultHeader("Authorization", "Bearer $token")
        .defaultHeader("Accept", "application/vnd.github.v3+json")
        .build()

    suspend fun createComment(repoFullName: String, prNumber: Int, body: String): Long? =
        try {
            @Suppress("UNCHECKED_CAST")
            val response = webClient.post()
                .uri("/repos/$repoFullName/issues/$prNumber/comments")
                .bodyValue(mapOf("body" to body))
                .retrieve()
                .bodyToMono(Map::class.java)
                .awaitSingle() as Map<String, Any?>
            (response["id"] as? Number)?.toLong()
        } catch (e: Exception) {
            log.error("GitHub PR 코멘트 등록 실패: $repoFullName#$prNumber — ${e.message}")
            null
        }

    fun buildReviewBody(
        highCount: Int, mediumCount: Int, lowCount: Int,
        comments: List<CommentItem>
    ): String {
        val sb = StringBuilder()
        sb.appendLine("## 🤖 코디(Code AI) 코드리뷰")
        sb.appendLine()
        sb.appendLine("| 심각도 | 건수 |")
        sb.appendLine("|--------|------|")
        sb.appendLine("| 🔴 HIGH | $highCount |")
        sb.appendLine("| 🟡 MEDIUM | $mediumCount |")
        sb.appendLine("| 🟢 LOW | $lowCount |")
        sb.appendLine()

        if (comments.isEmpty()) {
            sb.appendLine("✅ 이슈가 발견되지 않았습니다.")
        } else {
            val severityOrder = mapOf("HIGH" to 0, "MEDIUM" to 1, "LOW" to 2)
            val sorted = comments.sortedBy { severityOrder[it.severity] ?: 3 }
            if (comments.size > 20) sb.appendLine("_총 ${comments.size}건 중 심각도 순 상위 20건 표시_\n")
            sorted.take(20).forEach { c ->
                val icon = when (c.severity) { "HIGH" -> "🔴"; "MEDIUM" -> "🟡"; else -> "🟢" }
                sb.appendLine("### $icon [${c.severity}] `${c.filePath}`${c.lineNumber?.let { ":$it" } ?: ""}")
                sb.appendLine(c.content)
                c.suggestion?.let {
                    sb.appendLine()
                    sb.appendLine("**수정 예시:**")
                    sb.appendLine("```kotlin")
                    sb.appendLine(it)
                    sb.appendLine("```")
                }
                sb.appendLine()
            }
        }
        return sb.toString()
    }
}

data class CommentItem(
    val severity: String,
    val filePath: String,
    val lineNumber: Int?,
    val content: String,
    val suggestion: String?
)
