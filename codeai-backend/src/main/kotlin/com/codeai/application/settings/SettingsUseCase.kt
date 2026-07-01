package com.codeai.application.settings

import com.codeai.application.connector.SlackWebhookException
import com.codeai.domain.repository.RepositoryRepository
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.infrastructure.slack.SlackWebhookClient
import com.codeai.presentation.settings.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SettingsUseCase(
    private val settingsStore: SettingsStore,
    private val slackWebhookClient: SlackWebhookClient,
    private val repositoryRepository: RepositoryRepository,
    @Value("\${codeai.webhook.callback-url:http://localhost:8080/webhook/github}") private val webhookCallbackUrl: String,
    @Value("\${slack.webhook.url:}") private val defaultSlackUrl: String
) {

    suspend fun getAll(): AllSettingsResponse = AllSettingsResponse(
        github = getGithub(),
        slack = getSlack(),
        claude = getClaude(),
        connectors = ConnectorsBlock(
            ai = AiConnectorBlock(
                active = settingsStore.get("ai.engine") ?: "claude",
                available = listOf("claude", "openai", "gemini")
            )
        )
    )

    suspend fun getSlack(): SlackSettingsResponse {
        val url = settingsStore.get("slack.webhook.url") ?: defaultSlackUrl
        val lastTestedAt = settingsStore.get("slack.last.tested.at")
            ?.runCatching { LocalDateTime.parse(this) }?.getOrNull()
        return SlackSettingsResponse(webhookUrl = url, connected = url.isNotBlank(), lastTestedAt = lastTestedAt)
    }

    suspend fun updateSlack(webhookUrl: String): SlackSettingsResponse {
        settingsStore.set("slack.webhook.url", webhookUrl)
        val lastTestedAt = settingsStore.get("slack.last.tested.at")
            ?.runCatching { LocalDateTime.parse(this) }?.getOrNull()
        return SlackSettingsResponse(webhookUrl = webhookUrl, connected = webhookUrl.isNotBlank(), lastTestedAt = lastTestedAt)
    }

    suspend fun sendSlackTest(): LocalDateTime {
        val url = settingsStore.get("slack.webhook.url") ?: defaultSlackUrl
        val payload = mapOf<String, Any>(
            "text" to "코디(Code AI) Slack 연동 테스트 메시지입니다. 정상적으로 연결되었습니다."
        )
        val sent = slackWebhookClient.send(payload, url)
        if (!sent) throw SlackWebhookException("Slack 웹훅 전송에 실패했습니다. 웹훅 URL을 확인하세요.")
        val now = LocalDateTime.now()
        settingsStore.set("slack.last.tested.at", now.toString())
        return now
    }

    suspend fun getClaude(): ClaudeSettingsResponse {
        val version = settingsStore.get("claude.prompt.version") ?: "v3"
        val tokens = settingsStore.get("claude.max.tokens")?.toIntOrNull() ?: 3000
        return ClaudeSettingsResponse(activePromptVersion = version, maxTokensPerReview = tokens)
    }

    suspend fun updateClaude(activePromptVersion: String, maxTokensPerReview: Int): ClaudeSettingsResponse {
        require(activePromptVersion in listOf("v1", "v2", "v3")) { "지원하지 않는 프롬프트 버전: $activePromptVersion" }
        require(maxTokensPerReview in 100..8000) { "maxTokensPerReview는 100~8000 사이여야 합니다" }
        settingsStore.set("claude.prompt.version", activePromptVersion)
        settingsStore.set("claude.max.tokens", maxTokensPerReview.toString())
        return ClaudeSettingsResponse(activePromptVersion = activePromptVersion, maxTokensPerReview = maxTokensPerReview)
    }

    suspend fun getGithub(): GithubSettingsResponse {
        val repos = repositoryRepository.findAll().map { it.fullName }
        val secret = settingsStore.get("github.webhook.secret") ?: ""
        val lastConnectedAt = settingsStore.get("github.last.connected.at")
            ?.runCatching { LocalDateTime.parse(this) }?.getOrNull()
        return GithubSettingsResponse(
            connectedRepos = repos,
            webhookUrl = webhookCallbackUrl,
            webhookSecret = if (secret.isNotBlank()) maskSecret(secret) else null,
            connected = secret.isNotBlank(),
            lastConnectedAt = lastConnectedAt
        )
    }

    suspend fun updateGithubSecret(webhookSecret: String): GithubSettingsResponse {
        require(webhookSecret.length >= 8) { "Webhook Secret은 8자 이상이어야 합니다" }
        settingsStore.set("github.webhook.secret", webhookSecret)
        val repos = repositoryRepository.findAll().map { it.fullName }
        val lastConnectedAt = settingsStore.get("github.last.connected.at")
            ?.runCatching { LocalDateTime.parse(this) }?.getOrNull()
        return GithubSettingsResponse(
            connectedRepos = repos,
            webhookUrl = webhookCallbackUrl,
            webhookSecret = maskSecret(webhookSecret),
            connected = true,
            lastConnectedAt = lastConnectedAt
        )
    }

    private fun maskSecret(secret: String): String =
        if (secret.length <= 4) "****"
        else "*".repeat(secret.length - 4) + secret.takeLast(4)

    suspend fun recordGithubConnection() {
        settingsStore.set("github.last.connected.at", LocalDateTime.now().toString())
    }
}
