package com.codeai.application.settings

import com.codeai.domain.repository.RepositoryRepository
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.infrastructure.slack.SlackWebhookClient
import com.codeai.presentation.settings.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class SettingsUseCase(
    private val settingsStore: SettingsStore,
    private val slackWebhookClient: SlackWebhookClient,
    private val repositoryRepository: RepositoryRepository,
    @Value("\${codeai.webhook.callback-url:http://localhost:8080/webhook/github}") private val webhookCallbackUrl: String
) {

    suspend fun getAll(): AllSettingsResponse = AllSettingsResponse(
        github = getGithub(),
        slack = getSlack(),
        claude = getClaude()
    )

    suspend fun getSlack(): SlackSettingsResponse {
        val url = settingsStore.get("slack.webhook.url") ?: ""
        return SlackSettingsResponse(webhookUrl = url, isConfigured = url.isNotBlank())
    }

    suspend fun updateSlack(webhookUrl: String): SlackSettingsResponse {
        settingsStore.set("slack.webhook.url", webhookUrl)
        return SlackSettingsResponse(webhookUrl = webhookUrl, isConfigured = webhookUrl.isNotBlank())
    }

    suspend fun sendSlackTest() {
        val url = settingsStore.get("slack.webhook.url") ?: ""
        val payload = mapOf<String, Any>(
            "text" to "코디(Code AI) Slack 연동 테스트 메시지입니다. 정상적으로 연결되었습니다."
        )
        slackWebhookClient.send(payload, url)
    }

    suspend fun getClaude(): ClaudeSettingsResponse {
        val version = settingsStore.get("claude.prompt.version") ?: "v3"
        val tokens = settingsStore.get("claude.max.tokens")?.toIntOrNull() ?: 3000
        return ClaudeSettingsResponse(promptVersion = version, maxTokens = tokens)
    }

    suspend fun updateClaude(promptVersion: String, maxTokens: Int): ClaudeSettingsResponse {
        require(promptVersion in listOf("v1", "v2", "v3")) { "지원하지 않는 프롬프트 버전: $promptVersion" }
        require(maxTokens in 100..8000) { "maxTokens는 100~8000 사이여야 합니다" }
        settingsStore.set("claude.prompt.version", promptVersion)
        settingsStore.set("claude.max.tokens", maxTokens.toString())
        return ClaudeSettingsResponse(promptVersion = promptVersion, maxTokens = maxTokens)
    }

    suspend fun getGithub(): GithubSettingsResponse {
        val repos = repositoryRepository.findAll().map { it.fullName }
        val secretConfigured = (settingsStore.get("github.webhook.secret") ?: "").isNotBlank()
        return GithubSettingsResponse(
            connectedRepos = repos,
            webhookCallbackUrl = webhookCallbackUrl,
            webhookSecretConfigured = secretConfigured
        )
    }

    suspend fun updateGithubSecret(webhookSecret: String): GithubSettingsResponse {
        require(webhookSecret.length >= 8) { "Webhook Secret은 8자 이상이어야 합니다" }
        settingsStore.set("github.webhook.secret", webhookSecret)
        val repos = repositoryRepository.findAll().map { it.fullName }
        return GithubSettingsResponse(
            connectedRepos = repos,
            webhookCallbackUrl = webhookCallbackUrl,
            webhookSecretConfigured = true
        )
    }
}
