package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.StepType
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface PipelineStepJpaRepository : JpaRepository<PipelineStepEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): List<PipelineStepEntity>
    fun findByPipelineExecutionIdAndStepType(pipelineExecutionId: Long, stepType: StepType): Optional<PipelineStepEntity>
}
