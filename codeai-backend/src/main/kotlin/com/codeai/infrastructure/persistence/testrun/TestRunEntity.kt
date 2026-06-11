package com.codeai.infrastructure.persistence.testrun

import com.codeai.domain.testrun.TestRun
import com.codeai.domain.testrun.TestRunStatus
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "test_runs")
data class TestRunEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long = 0,
    @Column(name = "pipeline_execution_id") val pipelineExecutionId: Long,
    @Enumerated(EnumType.STRING) @Column val status: TestRunStatus = TestRunStatus.PENDING,
    @Column(name = "total_tests") val totalTests: Int = 0,
    @Column val passed: Int = 0,
    @Column val failed: Int = 0,
    @Column(name = "coverage_pct") val coveragePct: Double? = null,
    @Column(name = "started_at") val startedAt: LocalDateTime? = null,
    @Column(name = "completed_at") val completedAt: LocalDateTime? = null,
    @Column(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = TestRun(
        id = id,
        pipelineExecutionId = pipelineExecutionId,
        status = status,
        totalTests = totalTests,
        passed = passed,
        failed = failed,
        coveragePct = coveragePct,
        startedAt = startedAt,
        completedAt = completedAt,
        createdAt = createdAt
    )

    companion object {
        fun from(d: TestRun) = TestRunEntity(
            id = d.id,
            pipelineExecutionId = d.pipelineExecutionId,
            status = d.status,
            totalTests = d.totalTests,
            passed = d.passed,
            failed = d.failed,
            coveragePct = d.coveragePct,
            startedAt = d.startedAt,
            completedAt = d.completedAt,
            createdAt = d.createdAt
        )
    }
}
