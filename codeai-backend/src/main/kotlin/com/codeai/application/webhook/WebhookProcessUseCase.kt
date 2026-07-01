package com.codeai.application.webhook

import com.codeai.application.settings.SettingsUseCase
import com.codeai.domain.admin.UserActivityLog
import com.codeai.domain.admin.UserActivityLogRepository
import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.repository.RepositoryRepository
import com.codeai.infrastructure.queue.RedisStreamProducer
import com.codeai.presentation.webhook.WebhookPayload
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class WebhookProcessUseCase(
    private val pipelineRepository: PipelineRepository,
    private val repositoryRepository: RepositoryRepository,
    private val streamProducer: RedisStreamProducer,
    private val objectMapper: ObjectMapper,
    private val settingsUseCase: SettingsUseCase,
    private val activityLogRepository: UserActivityLogRepository
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun process(rawPayload: String): WebhookResult {
        val payload = objectMapper.readValue(rawPayload, WebhookPayload::class.java)
        val pr = payload.pullRequest ?: throw IllegalArgumentException("pull_request 페이로드 없음")
        val repoPayload = payload.repository ?: throw IllegalArgumentException("repository 페이로드 없음")

        // 보안 게이트(§4-3-1, D21): 등록된 활성 레포의 PR 만 처리. 미등록/비활성은 무시(202).
        //   레포 등록은 SET002(POST /api/repositories)에서만 생성 — Webhook 자동 등록 폐지.
        val matched = repositoryRepository.findByGithubRepoId(repoPayload.id)
            ?: repositoryRepository.findByFullName(repoPayload.fullName)

        if (matched == null) {
            log.info("미등록 레포 Webhook 무시: ${repoPayload.fullName}")
            return WebhookResult.Ignored("미등록 레포지토리 (대시보드에서 먼저 등록 필요): ${repoPayload.fullName}")
        }
        if (!matched.isActive) {
            log.info("비활성 레포 Webhook 무시: ${repoPayload.fullName}")
            return WebhookResult.Ignored("비활성 레포지토리: ${repoPayload.fullName}")
        }

        // 수동 등록 레포의 github_repo_id 백필(첫 Webhook 시)
        val repo = if (matched.githubRepoId == null)
            repositoryRepository.save(matched.copy(githubRepoId = repoPayload.id))
        else matched

        pipelineRepository.findActive(repo.id, pr.number)?.let { active ->
            log.info("중복 Webhook 무시: repo=${repo.fullName}, PR#${pr.number} — 이미 실행 중인 파이프라인 존재 (id=${active.id})")
            return WebhookResult.Accepted(active.id)
        }

        val execution = pipelineRepository.save(
            PipelineExecution(
                repositoryId = repo.id,
                prNumber = pr.number,
                prTitle = pr.title,
                prUrl = pr.htmlUrl,
                prAuthor = pr.user.login,
                headSha = pr.head.sha,
                headBranch = pr.head.ref
            )
        )

        val eventData = mapOf(
            "pipelineExecutionId" to execution.id.toString(),
            "prNumber" to pr.number.toString(),
            "repoFullName" to repo.fullName,
            "headSha" to pr.head.sha,
            "headRef" to pr.head.ref,
            "prUrl" to pr.htmlUrl,
            "prTitle" to pr.title
        )
        streamProducer.publish(eventData).awaitSingle()
        settingsUseCase.recordGithubConnection()

        runCatching {
            activityLogRepository.save(
                UserActivityLog(
                    userId = null,
                    email = "${pr.user.login}@github",
                    action = "파이프라인 실행",
                    result = "성공"
                )
            )
        }

        log.info("Pipeline 생성: id=${execution.id}, repo=${repo.fullName}, PR#${pr.number}")
        return WebhookResult.Accepted(execution.id)
    }
}

/** Webhook 처리 결과 — 보안 게이트 통과 여부 구분 (v0.9 §4-3-1) */
sealed interface WebhookResult {
    data class Accepted(val pipelineExecutionId: Long) : WebhookResult
    data class Ignored(val reason: String) : WebhookResult
}
