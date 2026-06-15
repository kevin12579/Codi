package com.codeai.presentation.webhook

import com.fasterxml.jackson.annotation.JsonProperty

data class WebhookPayload(
    val action: String = "",
    @JsonProperty("pull_request") val pullRequest: PullRequestPayload? = null,
    val repository: RepositoryPayload? = null
)

data class PullRequestPayload(
    val number: Int = 0,
    val title: String = "",
    @JsonProperty("html_url") val htmlUrl: String = "",
    val head: HeadPayload = HeadPayload(),
    val user: UserPayload = UserPayload()
)

data class HeadPayload(val sha: String = "", val ref: String = "")

data class UserPayload(val login: String = "")

data class RepositoryPayload(
    val id: Long = 0,
    @JsonProperty("full_name") val fullName: String = "",
    val name: String = "",
    val owner: OwnerPayload = OwnerPayload()
)

data class OwnerPayload(val login: String = "")
