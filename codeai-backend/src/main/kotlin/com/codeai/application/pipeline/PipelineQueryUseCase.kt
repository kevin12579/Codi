package com.codeai.application.pipeline

import com.codeai.domain.notification.NotificationRepository
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.review.CodeReviewRepository
import com.codeai.presentation.pipeline.*
import org.springframework.stereotype.Service

@Service
class PipelineQueryUseCase(
    private val pipelineRepository: PipelineRepository,
    private val reviewRepository: CodeReviewRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend fun getList(
        status: String?, from: String?, to: String?, page: Int, size: Int
    ): PipelineListResponse {
        val pageResult = pipelineRepository.findAll(status, from, to, page, size)
        return PipelineListResponse(
            content = pageResult.content.map { PipelineSummary.from(it) },
            totalElements = pageResult.totalElements,
            totalPages = pageResult.totalPages,
            currentPage = pageResult.currentPage
        )
    }

    suspend fun getDetail(id: Long): PipelineDetailResponse {
        val execution = pipelineRepository.findById(id)
            ?: throw NoSuchElementException("파이프라인을 찾을 수 없습니다: id=$id")

        val review = reviewRepository.findByPipelineExecutionId(id)
        val comments = review?.let { reviewRepository.findCommentsByReviewId(it.id) } ?: emptyList()
        val notifications = notificationRepository.findByPipelineExecutionId(id)

        return PipelineDetailResponse(
            id = execution.id, prNumber = execution.prNumber,
            prTitle = execution.prTitle, prUrl = execution.prUrl,
            prAuthor = execution.prAuthor, headSha = execution.headSha,
            status = execution.status.name, startedAt = execution.startedAt,
            completedAt = execution.completedAt,
            review = review?.let { ReviewSummary.from(it, comments) },
            notifications = notifications.map { NotificationSummary.from(it) }
        )
    }
}
