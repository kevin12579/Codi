package com.codeai.application.deploy

import com.codeai.domain.pipeline.PipelineStep
import com.codeai.domain.pipeline.PipelineStepRepository
import com.codeai.domain.pipeline.StepType
import com.codeai.domain.review.CodeReviewRepository
import com.codeai.domain.review.ReviewStatus
import com.codeai.domain.testrun.TestRunRepository
import com.codeai.domain.testrun.TestRunStatus
import com.codeai.plugin.registry.ProviderRegistry
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class DeployUseCase(
    private val reviewRepository: CodeReviewRepository,
    private val testRunRepository: TestRunRepository,
    private val stepRepository: PipelineStepRepository,
    private val registry: ProviderRegistry
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    /**
     * 리뷰 통과 + 테스트 통과 시 배포 워크플로우를 트리거합니다.
     * HIGH 이슈가 없고 테스트가 PASSED인 경우에만 배포합니다.
     */
    suspend fun triggerIfEligible(pipelineExecutionId: Long, repoFullName: String, ref: String): Boolean {
        val review = reviewRepository.findByPipelineExecutionId(pipelineExecutionId)
        val testRun = testRunRepository.findByPipelineExecutionId(pipelineExecutionId)

        val reviewPassed = review?.status == ReviewStatus.COMPLETED && (review.highCount == 0)
        val testsPassed = testRun?.status == TestRunStatus.PASSED

        var step = stepRepository.save(
            PipelineStep(pipelineExecutionId = pipelineExecutionId, stepType = StepType.DEPLOY).start()
        )

        if (!reviewPassed || !testsPassed) {
            log.info("배포 조건 미충족 — 스킵: pipelineId=$pipelineExecutionId, reviewOk=$reviewPassed, testOk=$testsPassed")
            stepRepository.save(step.skip())
            return false
        }

        val triggered = registry.activeDeployer().deploy(
            repoFullName = repoFullName,
            ref = ref,
            inputs = mapOf("pipeline_id" to pipelineExecutionId.toString())
        )

        step = if (triggered) stepRepository.save(step.succeed())
               else stepRepository.save(step.fail("GitHub Actions 트리거 실패"))

        log.info("배포 트리거 ${if (triggered) "완료" else "실패"}: pipelineId=$pipelineExecutionId, ref=$ref")
        return triggered
    }
}
