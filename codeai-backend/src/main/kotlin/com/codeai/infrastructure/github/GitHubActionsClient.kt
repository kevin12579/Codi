package com.codeai.infrastructure.github

import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

/**
 * GitHub Actions workflow_dispatch API를 통해 배포 워크플로우를 트리거합니다.
 * 실제 배포는 GitHub Actions 워크플로우(.github/workflows/deploy.yml)가 담당합니다.
 */
@Component
class GitHubActionsClient(
    @Value("\${github.token}") private val token: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val webClient = WebClient.builder()
        .baseUrl("https://api.github.com")
        .defaultHeader("Authorization", "Bearer $token")
        .defaultHeader("Accept", "application/vnd.github.v3+json")
        .build()

    /**
     * workflow_dispatch 이벤트를 발생시켜 배포 워크플로우를 트리거합니다.
     * @return true if dispatch was accepted (HTTP 204)
     */
    suspend fun triggerDeploy(repoFullName: String, workflowId: String, ref: String, inputs: Map<String, String> = emptyMap()): Boolean {
        return try {
            val body = mapOf(
                "ref" to ref,
                "inputs" to inputs
            )
            webClient.post()
                .uri("/repos/$repoFullName/actions/workflows/$workflowId/dispatches")
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .awaitSingle()
            log.info("배포 워크플로우 트리거 완료: repo=$repoFullName, workflow=$workflowId, ref=$ref")
            true
        } catch (e: Exception) {
            log.error("배포 워크플로우 트리거 실패: ${e.message}")
            false
        }
    }

    /**
     * 최신 워크플로우 실행 상태를 조회합니다.
     */
    suspend fun getLatestRunStatus(repoFullName: String, workflowId: String): String? {
        return try {
            val response = webClient.get()
                .uri("/repos/$repoFullName/actions/workflows/$workflowId/runs?per_page=1")
                .retrieve()
                .bodyToMono(Map::class.java)
                .awaitSingle()
            @Suppress("UNCHECKED_CAST")
            val runs = response["workflow_runs"] as? List<Map<String, Any>>
            runs?.firstOrNull()?.get("status") as? String
        } catch (e: Exception) {
            log.error("워크플로우 상태 조회 실패: ${e.message}")
            null
        }
    }
}
