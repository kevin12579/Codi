package com.codeai.domain.pipeline

interface PipelineStepRepository {
    suspend fun save(step: PipelineStep): PipelineStep
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): List<PipelineStep>
    suspend fun findByPipelineExecutionIdAndType(pipelineExecutionId: Long, stepType: StepType): PipelineStep?
}
