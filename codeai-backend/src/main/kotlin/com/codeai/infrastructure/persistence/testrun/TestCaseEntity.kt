package com.codeai.infrastructure.persistence.testrun

import com.codeai.domain.testrun.TestCase
import com.codeai.domain.testrun.TestResult
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "test_cases")
data class TestCaseEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long = 0,
    @Column(name = "test_run_id") val testRunId: Long,
    @Column(name = "test_name") val testName: String,
    @Enumerated(EnumType.STRING) @Column val status: TestResult,
    @Column(name = "duration_ms") val durationMs: Int? = null,
    @Column(name = "error_message") val errorMessage: String? = null,
    @Column(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = TestCase(
        id = id,
        testRunId = testRunId,
        testName = testName,
        status = status,
        durationMs = durationMs,
        errorMessage = errorMessage,
        createdAt = createdAt
    )

    companion object {
        fun from(d: TestCase) = TestCaseEntity(
            id = d.id,
            testRunId = d.testRunId,
            testName = d.testName,
            status = d.status,
            durationMs = d.durationMs,
            errorMessage = d.errorMessage,
            createdAt = d.createdAt
        )
    }
}
