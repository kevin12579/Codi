package com.codeai.application.deploy

import com.codeai.application.audit.AuditService
import com.codeai.domain.audit.AuditAction
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.pipeline.PipelineStatus
import com.codeai.domain.pipeline.PipelineStep
import com.codeai.domain.pipeline.PipelineStepRepository
import com.codeai.domain.pipeline.StepType
import com.codeai.domain.repository.RepositoryRepository
import com.codeai.domain.review.CodeReviewRepository
import com.codeai.domain.review.ReviewStatus
import com.codeai.domain.testrun.TestRunRepository
import com.codeai.domain.testrun.TestRunStatus
import com.codeai.infrastructure.cache.PipelineCacheService
import com.codeai.plugin.registry.ProviderRegistry
import com.codeai.plugin.spi.DeployRequest
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

/**
 * 배포 승인 게이트 (v0.9 D10, §4-3).
 *
 * v0.7 의 `triggerIfEligible()`(사람 없이 자동 배포) 를 폐기하고,
 * 조건 충족 파이프라인은 `DEPLOY_CANDIDATE` 로만 표시(RedisStreamConsumer) →
 * **ADMIN 이 [배포 승인] 했을 때만** `approveAndDeploy()` 로 트리거한다.
 * 승인 시 `highCount==0 && testsPassed` 를 **다시 검증**(결정적 게이트, UI/AI 신뢰 안 함)하고
 * 승인 행위를 audit_logs(DEPLOY_APPROVE)에 남긴다.
 */
@Service
class DeployUseCase(
    private val reviewRepository: CodeReviewRepository,
    private val testRunRepository: TestRunRepository,
    private val stepRepository: PipelineStepRepository,
    private val registry: ProviderRegistry,
    private val pipelineRepository: PipelineRepository,
    private val repositoryRepository: RepositoryRepository,
    private val auditService: AuditService,
    private val cache: PipelineCacheService,
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    /** 배포 적격 여부: HIGH 0건 && 테스트 PASSED. (어떤 구현체로 교체해도 불변인 도메인 규칙) */
    suspend fun isEligible(pipelineExecutionId: Long): Boolean {
        val review = reviewRepository.findByPipelineExecutionId(pipelineExecutionId)
        val testRun = testRunRepository.findByPipelineExecutionId(pipelineExecutionId)
        val reviewPassed = review?.status == ReviewStatus.COMPLETED && review.highCount == 0
        val testsPassed = testRun?.status == TestRunStatus.PASSED
        return reviewPassed && testsPassed
    }

    /**
     * ADMIN 승인 → 결정적 재검증 → 배포 트리거 + audit. (POST /api/pipelines/{id}/deploy)
     */
    suspend fun approveAndDeploy(
        pipelineExecutionId: Long,
        actorId: Long?,
        ip: String?,
        userAgent: String?,
    ): DeployApprovalResult {
        val execution = pipelineRepository.findById(pipelineExecutionId)
            ?: return DeployApprovalResult(DeployApprovalOutcome.NOT_FOUND, "파이프라인을 찾을 수 없습니다")

        if (execution.status != PipelineStatus.DEPLOY_CANDIDATE) {
            return DeployApprovalResult(
                DeployApprovalOutcome.NOT_CANDIDATE,
                "배포 후보(DEPLOY_CANDIDATE) 상태가 아닙니다 (현재: ${execution.status})"
            )
        }

        // 결정적 게이트: 승인 시점에 다시 검증
        if (!isEligible(pipelineExecutionId)) {
            return DeployApprovalResult(
                DeployApprovalOutcome.NOT_ELIGIBLE,
                "배포 조건 미충족 (HIGH 0건 && 테스트 PASSED 필요)"
            )
        }

        val repo = repositoryRepository.findById(execution.repositoryId)
            ?: return DeployApprovalResult(DeployApprovalOutcome.NOT_FOUND, "레포지토리를 찾을 수 없습니다")

        val ref = execution.headBranch?.takeIf { it.isNotBlank() } ?: execution.headSha

        var step = stepRepository.save(
            PipelineStep(pipelineExecutionId = pipelineExecutionId, stepType = StepType.DEPLOY).start()
        )

        val handle = registry.activeDeployer().deploy(
            DeployRequest(
                repoFullName = repo.fullName,
                ref = ref,
                inputs = mapOf("pipeline_id" to pipelineExecutionId.toString())
            )
        )
        val triggered = handle.triggered

        step = if (triggered) stepRepository.save(step.succeed())
               else stepRepository.save(step.fail("GitHub Actions 트리거 실패"))

        if (triggered) {
            pipelineRepository.save(execution.complete())  // DEPLOY_CANDIDATE → SUCCESS
            // 승인으로 상태가 바뀌었으니 상세/목록 캐시를 즉시 무효화(안 하면 60s TTL 동안 목록이 옛 상태로 남음)
            cache.evict(PipelineCacheService.detailKey(pipelineExecutionId))
            cache.evictByPattern("pipeline:list:*")
            auditService.record(
                action = AuditAction.DEPLOY_APPROVE,
                target = "pipeline:$pipelineExecutionId",
                detail = "repo=${repo.fullName}, ref=$ref",
                actorId = actorId,
                ip = ip,
                userAgent = userAgent,
            )
            log.info("배포 승인·트리거 완료: pipelineId=$pipelineExecutionId, ref=$ref, actor=$actorId")
            return DeployApprovalResult(DeployApprovalOutcome.APPROVED, "배포를 트리거했습니다")
        }

        log.warn("배포 트리거 실패: pipelineId=$pipelineExecutionId, ref=$ref")
        return DeployApprovalResult(DeployApprovalOutcome.TRIGGER_FAILED, "배포 트리거에 실패했습니다")
    }
}

enum class DeployApprovalOutcome { APPROVED, NOT_FOUND, NOT_CANDIDATE, NOT_ELIGIBLE, TRIGGER_FAILED }

data class DeployApprovalResult(val outcome: DeployApprovalOutcome, val message: String)
