package com.codeai.infrastructure.persistence.testrun

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface TestRunJpaRepository : JpaRepository<TestRunEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): Optional<TestRunEntity>
}

interface TestCaseJpaRepository : JpaRepository<TestCaseEntity, Long> {
    fun findByTestRunId(testRunId: Long): List<TestCaseEntity>
}
