package com.codeai.presentation.settings

data class AllSettingsResponse(
    val github: GithubSettingsResponse,
    val slack: SlackSettingsResponse,
    val claude: ClaudeSettingsResponse
)

data class SlackSettingsResponse(
    val webhookUrl: String,
    val isConfigured: Boolean
)

data class ClaudeSettingsResponse(
    val promptVersion: String,
    val maxTokens: Int,
    val availableVersions: List<String> = listOf("v1", "v2", "v3")
)

data class GithubSettingsResponse(
    val connectedRepos: List<String>,
    val webhookCallbackUrl: String,
    val webhookSecretConfigured: Boolean
)
