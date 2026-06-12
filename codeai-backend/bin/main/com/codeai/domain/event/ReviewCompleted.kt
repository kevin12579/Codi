package com.codeai.domain.event

import java.time.LocalDateTime

data class ReviewCompleted(
    val pipelineExecutionId: Long,
    val codeReviewId: Long,
    val highCount: Int,
    val mediumCount: Int,
    val lowCount: Int,
    val prUrl: String,
    val prTitle: String,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
