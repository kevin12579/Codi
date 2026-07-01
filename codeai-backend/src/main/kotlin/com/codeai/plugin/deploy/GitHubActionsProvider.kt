package com.codeai.plugin.deploy

import com.codeai.infrastructure.github.GitHubActionsClient
import com.codeai.plugin.spi.DeployHandle
import com.codeai.plugin.spi.DeployMode
import com.codeai.plugin.spi.DeployProvider
import com.codeai.plugin.spi.DeployRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

/**
 * GitHub Actions 배포 프로바이더 (PUSH형) — 기존 GitHubActionsClient(workflow_dispatch) 를
 * DeployProvider SPI 로 래핑(로직 불변). workflow-id 는 본 프로바이더가 보유한다.
 */
@Component
class GitHubActionsProvider(
    private val client: GitHubActionsClient,
    @Value("\${github.deploy.workflow-id:deploy.yml}") private val workflowId: String,
) : DeployProvider {
    override val id = "github-actions"
    override val mode = DeployMode.PUSH

    override suspend fun deploy(req: DeployRequest): DeployHandle {
        val triggered = client.triggerDeploy(req.repoFullName, workflowId, req.ref, req.inputs)
        return DeployHandle(id = "${req.repoFullName}@${req.ref}", triggered = triggered)
    }
}
