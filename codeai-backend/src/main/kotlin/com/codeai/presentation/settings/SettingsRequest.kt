package com.codeai.presentation.settings

data class SlackSettingsRequest(val webhookUrl: String)

data class ClaudeSettingsRequest(
    val promptVersion: String,
    val maxTokens: Int
)

data class GithubSettingsRequest(val webhookSecret: String)
