package com.codeai.presentation.settings

import java.time.LocalDateTime

data class AllSettingsResponse(
    val github: GithubSettingsResponse,
    val slack: SlackSettingsResponse,
    val claude: ClaudeSettingsResponse,
    val connectors: ConnectorsBlock
)

data class ConnectorsBlock(
    val ai: AiConnectorBlock
)

data class AiConnectorBlock(
    val active: String,
    val available: List<String>
)

data class SlackSettingsResponse(
    val webhookUrl: String,
    val connected: Boolean,
    val lastTestedAt: LocalDateTime?
)

data class ClaudeSettingsResponse(
    val activePromptVersion: String,
    val maxTokensPerReview: Int,
    val availableVersions: List<String> = listOf("v1", "v2", "v3")
)

data class SlackTestResponse(
    val sent: Boolean,
    val sentAt: LocalDateTime
)

data class GithubSettingsResponse(
    val connectedRepos: List<String>,
    val webhookUrl: String,
    val webhookSecret: String?,
    val connected: Boolean,
    val lastConnectedAt: LocalDateTime?
)
