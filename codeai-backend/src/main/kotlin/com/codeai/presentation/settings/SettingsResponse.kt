package com.codeai.presentation.settings

import java.time.LocalDateTime

data class AllSettingsResponse(
    val github: GithubSettingsResponse,
    val slack: SlackSettingsResponse,
    val claude: ClaudeSettingsResponse
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

data class GithubSettingsResponse(
    val connectedRepos: List<String>,
    val webhookUrl: String,
    val connected: Boolean,
    val lastConnectedAt: LocalDateTime?
)
