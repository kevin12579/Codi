package com.codeai.plugin.vcs

import com.codeai.infrastructure.github.GitHubApiClient
import com.codeai.infrastructure.github.GitHubPrCommentClient
import com.codeai.plugin.spi.VCSProvider
import org.springframework.stereotype.Component

/**
 * GitHub VCS 프로바이더 — 기존 GitHubApiClient(diff)·GitHubPrCommentClient(코멘트) 를
 * VCSProvider SPI 로 래핑(로직 불변). 레퍼런스 구현 1종.
 */
@Component
class GitHubProvider(
    private val apiClient: GitHubApiClient,
    private val prCommentClient: GitHubPrCommentClient,
) : VCSProvider {
    override val id = "github"

    override suspend fun getDiff(repoFullName: String, prNumber: Int): String =
        apiClient.getPrDiff(repoFullName, prNumber)

    override suspend fun postReviewComment(repoFullName: String, prNumber: Int, body: String): Long? =
        prCommentClient.createComment(repoFullName, prNumber, body)
}
