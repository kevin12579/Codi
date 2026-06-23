package com.codeai.plugin.deploy

import com.codeai.infrastructure.github.GitHubActionsClient
import com.codeai.plugin.spi.DeployProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

/**
 * GitHub Actions 배포 프로바이더 — 기존 GitHubActionsClient(workflow_dispatch) 를
 * DeployProvider SPI 로 래핑(로직 불변). workflow-id 는 본 프로바이더가 보유한다.
 */
@Component
class GitHubActionsProvider(
    private val client: GitHubActionsClient,
    @Value("\${github.deploy.workflow-id:deploy.yml}") private val workflowId: String,
) : DeployProvider {
    override val id = "github-actions"

    override suspend fun deploy(repoFullName: String, ref: String, inputs: Map<String, String>): Boolean =
        client.triggerDeploy(repoFullName, workflowId, ref, inputs)
}
