package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineStep
import com.codeai.domain.pipeline.StepStatus
import com.codeai.domain.pipeline.StepType
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "pipeline_steps")
data class PipelineStepEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long = 0,
    @Column(name = "pipeline_execution_id") val pipelineExecutionId: Long,
    @Enumerated(EnumType.STRING) @Column(name = "step_type") val stepType: StepType,
    @Enumerated(EnumType.STRING) @Column val status: StepStatus = StepStatus.PENDING,
    @Column(name = "started_at") val startedAt: LocalDateTime? = null,
    @Column(name = "completed_at") val completedAt: LocalDateTime? = null,
    @Column(name = "error_message") val errorMessage: String? = null,
    @Column(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = PipelineStep(
        id = id, pipelineExecutionId = pipelineExecutionId,
        stepType = stepType, status = status,
        startedAt = startedAt, completedAt = completedAt,
        errorMessage = errorMessage, createdAt = createdAt
    )

    companion object {
        fun from(d: PipelineStep) = PipelineStepEntity(
            id = d.id, pipelineExecutionId = d.pipelineExecutionId,
            stepType = d.stepType, status = d.status,
            startedAt = d.startedAt, completedAt = d.completedAt,
            errorMessage = d.errorMessage, createdAt = d.createdAt
        )
    }
}
