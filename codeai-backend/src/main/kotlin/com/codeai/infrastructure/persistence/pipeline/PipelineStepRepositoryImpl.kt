package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineStep
import com.codeai.domain.pipeline.PipelineStepRepository
import com.codeai.domain.pipeline.StepType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository

@Repository
class PipelineStepRepositoryImpl(
    private val jpa: PipelineStepJpaRepository
) : PipelineStepRepository {

    override suspend fun save(step: PipelineStep): PipelineStep = withContext(Dispatchers.IO) {
        jpa.save(PipelineStepEntity.from(step)).toDomain()
    }

    override suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): List<PipelineStep> =
        withContext(Dispatchers.IO) {
            jpa.findByPipelineExecutionId(pipelineExecutionId).map { it.toDomain() }
        }

    override suspend fun findByPipelineExecutionIdAndType(pipelineExecutionId: Long, stepType: StepType): PipelineStep? =
        withContext(Dispatchers.IO) {
            jpa.findByPipelineExecutionIdAndStepType(pipelineExecutionId, stepType).orElse(null)?.toDomain()
        }
}
