package com.codeai.presentation.settings

data class SlackSettingsRequest(val webhookUrl: String)

data class ClaudeSettingsRequest(
    val activePromptVersion: String,
    val maxTokensPerReview: Int
)

data class GithubSettingsRequest(val webhookSecret: String)
