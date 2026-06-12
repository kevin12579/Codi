package com.codeai.infrastructure.github

import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class GitHubApiClient(
    @Value("\${github.token}") private val token: String
) {
    private val webClient = WebClient.builder()
        .baseUrl("https://api.github.com")
        .defaultHeader("Authorization", "Bearer $token")
        .defaultHeader("Accept", "application/vnd.github.v3+json")
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    suspend fun getPrDiff(repoFullName: String, prNumber: Int): String =
        webClient.get()
            .uri("/repos/$repoFullName/pulls/$prNumber")
            .header("Accept", "application/vnd.github.v3.diff")
            .retrieve()
            .bodyToMono(String::class.java)
            .awaitSingle()
}
