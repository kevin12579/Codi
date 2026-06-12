package com.codeai.domain.testrun

import java.time.LocalDateTime

data class TestCase(
    val id: Long = 0,
    val testRunId: Long,
    val testName: String,
    val status: TestResult,
    val durationMs: Int? = null,
    val errorMessage: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
