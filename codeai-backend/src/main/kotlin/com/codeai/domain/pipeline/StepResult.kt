package com.codeai.domain.pipeline

data class StepResult(
    val stepType: StepType,
    val success: Boolean,
    val errorMessage: String? = null
)
