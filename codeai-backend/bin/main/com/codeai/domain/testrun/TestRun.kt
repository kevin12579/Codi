package com.codeai.domain.testrun

import java.time.LocalDateTime

data class TestRun(
    val id: Long = 0,
    val pipelineExecutionId: Long,
    val status: TestRunStatus = TestRunStatus.PENDING,
    val totalTests: Int = 0,
    val passed: Int = 0,
    val failed: Int = 0,
    val coveragePct: Double? = null,
    val startedAt: LocalDateTime? = null,
    val completedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun start() = copy(status = TestRunStatus.RUNNING, startedAt = LocalDateTime.now())

    fun complete(total: Int, passed: Int, failed: Int, coverage: Double? = null) = copy(
        status = if (failed == 0) TestRunStatus.PASSED else TestRunStatus.FAILED,
        totalTests = total,
        passed = passed,
        failed = failed,
        coveragePct = coverage,
        completedAt = LocalDateTime.now()
    )

    fun fail() = copy(status = TestRunStatus.FAILED, completedAt = LocalDateTime.now())
}
