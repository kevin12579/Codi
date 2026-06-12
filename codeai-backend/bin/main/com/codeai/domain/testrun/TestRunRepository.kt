package com.codeai.domain.testrun

interface TestRunRepository {
    suspend fun save(testRun: TestRun): TestRun
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): TestRun?
    suspend fun findById(id: Long): TestRun?
    suspend fun saveTestCase(testCase: TestCase): TestCase
    suspend fun findTestCasesByRunId(testRunId: Long): List<TestCase>
}
