package com.codeai.application.testrun

import com.codeai.application.notification.NotifyUseCase
import com.codeai.domain.event.TestRunCompleted
import com.codeai.domain.testrun.TestRun
import com.codeai.domain.testrun.TestRunRepository
import com.codeai.infrastructure.playwright.PlaywrightResultParser
import com.codeai.infrastructure.playwright.PlaywrightRunner
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class TestRunUseCase(
    private val testRunRepository: TestRunRepository,
    private val playwrightRunner: PlaywrightRunner,
    private val notifyUseCase: NotifyUseCase
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun runTests(pipelineExecutionId: Long, headSha: String): TestRun {
        log.info("테스트 실행 시작: pipelineId=$pipelineExecutionId, sha=$headSha")

        var testRun = testRunRepository.save(
            TestRun(pipelineExecutionId = pipelineExecutionId).start()
        )

        return try {
            val result = playwrightRunner.run()

            val domainCases = PlaywrightResultParser.toDomainCases(result, testRun.id)
            domainCases.forEach { testRunRepository.saveTestCase(it) }

            testRun = testRunRepository.save(
                testRun.complete(
                    total = result.totalTests,
                    passed = result.passed,
                    failed = result.failed
                )
            )

            val event = TestRunCompleted(
                pipelineExecutionId = pipelineExecutionId,
                testRunId = testRun.id,
                passed = result.failed == 0,
                totalTests = result.totalTests,
                failedCount = result.failed
            )
            notifyUseCase.onTestRunCompleted(event)

            log.info("테스트 완료: pipelineId=$pipelineExecutionId, passed=${result.passed}, failed=${result.failed}")
            testRun
        } catch (e: Exception) {
            log.error("테스트 실행 중 오류: ${e.message}", e)
            testRunRepository.save(testRun.fail())
        }
    }
}
