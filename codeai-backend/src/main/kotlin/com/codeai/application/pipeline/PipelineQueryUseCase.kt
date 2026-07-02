package com.codeai.application.pipeline

import com.codeai.application.connector.PipelineNotFoundException
import com.codeai.domain.notification.NotificationRepository
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.pipeline.PipelineStepRepository
import com.codeai.domain.review.CodeReviewRepository
import com.codeai.domain.testrun.TestRunRepository
import com.codeai.infrastructure.cache.PipelineCacheService
import com.codeai.presentation.pipeline.*
import org.springframework.stereotype.Service

@Service
class PipelineQueryUseCase(
    private val pipelineRepository: PipelineRepository,
    private val stepRepository: PipelineStepRepository,
    private val reviewRepository: CodeReviewRepository,
    private val testRunRepository: TestRunRepository,
    private val notificationRepository: NotificationRepository,
    private val cache: PipelineCacheService
) {
    suspend fun getList(
        status: String?, from: String?, to: String?, page: Int, size: Int,
        repositoryId: Long? = null
    ): PipelineListResponse {
        val key = PipelineCacheService.listKey(status, from, to, page, size, repositoryId)
        return cache.getOrLoad(key, PipelineListResponse::class.java) {
            val pageResult = pipelineRepository.findAll(status, from, to, page, size, repositoryId)
            PipelineListResponse(
                content = pageResult.content.map { e ->
                    PipelineSummary.from(e, repoFullNameFrom(e.prUrl))
                },
                totalElements = pageResult.totalElements,
                totalPages = pageResult.totalPages,
                currentPage = pageResult.currentPage
            )
        }
    }

    suspend fun getDetail(id: Long): PipelineDetailResponse {
        val key = PipelineCacheService.detailKey(id)
        return cache.getOrLoad(key, PipelineDetailResponse::class.java) {
            val execution = pipelineRepository.findById(id)
                ?: throw PipelineNotFoundException(id)

            val steps = stepRepository.findByPipelineExecutionId(id)
            val review = reviewRepository.findByPipelineExecutionId(id)
            val comments = review?.let { reviewRepository.findCommentsByReviewId(it.id) } ?: emptyList()
            val testRun = testRunRepository.findByPipelineExecutionId(id)
            val testCases = testRun?.let { testRunRepository.findTestCasesByRunId(it.id) } ?: emptyList()
            val notifications = notificationRepository.findByPipelineExecutionId(id)

            PipelineDetailResponse(
                id = execution.id,
                repositoryFullName = repoFullNameFrom(execution.prUrl),
                vcsId = execution.vcsId,
                prNumber = execution.prNumber,
                prTitle = execution.prTitle, prUrl = execution.prUrl,
                prAuthor = execution.prAuthor, headSha = execution.headSha,
                status = execution.status.name, startedAt = execution.startedAt,
                completedAt = execution.completedAt,
                steps = steps.map { StepSummary.from(it) },
                review = review?.let { ReviewSummary.from(it, comments) },
                testRun = testRun?.let { TestRunSummary.from(it, testCases) },
                notifications = notifications.map { NotificationSummary.from(it) }
            )
        }
    }

    private fun repoFullNameFrom(prUrl: String): String =
        prUrl.removePrefix("https://github.com/").substringBefore("/pull/")
}
