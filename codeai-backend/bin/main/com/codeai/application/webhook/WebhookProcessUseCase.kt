package com.codeai.application.webhook

import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.repository.Repository
import com.codeai.domain.repository.RepositoryRepository
import com.codeai.infrastructure.queue.RedisStreamProducer
import com.codeai.presentation.webhook.WebhookPayload
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class WebhookProcessUseCase(
    private val pipelineRepository: PipelineRepository,
    private val repositoryRepository: RepositoryRepository,
    private val streamProducer: RedisStreamProducer,
    private val objectMapper: ObjectMapper,
    @Value("\${codeai.webhook.secret}") private val webhookSecret: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun process(rawPayload: String): Long {
        val payload = objectMapper.readValue(rawPayload, WebhookPayload::class.java)
        val pr = payload.pullRequest ?: throw IllegalArgumentException("pull_request 페이로드 없음")
        val repoPayload = payload.repository ?: throw IllegalArgumentException("repository 페이로드 없음")

        val repo = repositoryRepository.findByGithubRepoId(repoPayload.id)
            ?: repositoryRepository.save(
                Repository(
                    githubRepoId = repoPayload.id,
                    owner = repoPayload.owner.login,
                    name = repoPayload.name,
                    fullName = repoPayload.fullName,
                    webhookSecret = webhookSecret
                )
            )

        val execution = pipelineRepository.save(
            PipelineExecution(
                repositoryId = repo.id,
                prNumber = pr.number,
                prTitle = pr.title,
                prUrl = pr.htmlUrl,
                prAuthor = pr.user.login,
                headSha = pr.head.sha
            )
        )

        val eventData = mapOf(
            "pipelineExecutionId" to execution.id.toString(),
            "prNumber" to pr.number.toString(),
            "repoFullName" to repo.fullName,
            "headSha" to pr.head.sha,
            "prUrl" to pr.htmlUrl,
            "prTitle" to pr.title
        )
        streamProducer.publish(eventData).awaitSingle()

        log.info("Pipeline 생성: id=${execution.id}, repo=${repo.fullName}, PR#${pr.number}")
        return execution.id
    }
}
