package com.codeai.infrastructure.persistence.testrun

import com.codeai.domain.testrun.TestCase
import com.codeai.domain.testrun.TestRun
import com.codeai.domain.testrun.TestRunRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository

@Repository
class TestRunRepositoryImpl(
    private val testRunJpa: TestRunJpaRepository,
    private val testCaseJpa: TestCaseJpaRepository
) : TestRunRepository {

    override suspend fun save(testRun: TestRun): TestRun = withContext(Dispatchers.IO) {
        testRunJpa.save(TestRunEntity.from(testRun)).toDomain()
    }

    override suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): TestRun? =
        withContext(Dispatchers.IO) {
            testRunJpa.findByPipelineExecutionId(pipelineExecutionId).orElse(null)?.toDomain()
        }

    override suspend fun findById(id: Long): TestRun? = withContext(Dispatchers.IO) {
        testRunJpa.findById(id).orElse(null)?.toDomain()
    }

    override suspend fun saveTestCase(testCase: TestCase): TestCase = withContext(Dispatchers.IO) {
        testCaseJpa.save(TestCaseEntity.from(testCase)).toDomain()
    }

    override suspend fun findTestCasesByRunId(testRunId: Long): List<TestCase> =
        withContext(Dispatchers.IO) {
            testCaseJpa.findByTestRunId(testRunId).map { it.toDomain() }
        }
}
