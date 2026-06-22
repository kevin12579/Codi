package com.codeai.application.review

import com.codeai.application.notification.NotifyUseCase
import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.review.*
import com.codeai.infrastructure.cache.PipelineCacheService
import com.codeai.infrastructure.github.CommentItem
import com.codeai.infrastructure.github.GitHubPrCommentClient
import com.codeai.plugin.registry.ProviderRegistry
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ReviewUseCase(
    private val pipelineRepository: PipelineRepository,
    private val reviewRepository: CodeReviewRepository,
    private val gitHubPrCommentClient: GitHubPrCommentClient,
    private val registry: ProviderRegistry,
    private val notifyUseCase: NotifyUseCase,
    private val cache: PipelineCacheService,
    @Value("\${codeai.review.prompt-version:v3}") private val promptVersion: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun execute(
        pipelineExecutionId: Long,
        repoFullName: String,
        prNumber: Int,
        headSha: String,
        prUrl: String,
        prTitle: String
    ) {
        val execution = pipelineRepository.findById(pipelineExecutionId)
            ?: throw NoSuchElementException("PipelineExecution not found: $pipelineExecutionId")
        val startedExecution = pipelineRepository.save(execution.start())

        val engine = registry.activeAiEngine()
        var review = reviewRepository.save(
            CodeReview(pipelineExecutionId = pipelineExecutionId, engineId = engine.id, promptVersion = promptVersion)
        )

        try {
            val vcs = registry.resolveVcs()
            val diff = vcs.getDiff(repoFullName, prNumber)
            log.info("PR diff 획득: $repoFullName#$prNumber, ${diff.length}자, 엔진=${engine.id}")

            val reviewResult = engine.review(diff, promptVersion)

            val savedComments = reviewResult.comments.map { parsed ->
                reviewRepository.saveComment(
                    ReviewComment(
                        codeReviewId = review.id,
                        severity = parsed.severity,
                        filePath = parsed.filePath,
                        lineNumber = parsed.lineNumber,
                        content = parsed.content,
                        suggestion = parsed.suggestion
                    )
                )
            }

            val commentItems = savedComments.map {
                CommentItem(it.severity.name, it.filePath, it.lineNumber, it.content, it.suggestion)
            }
            val commentBody = gitHubPrCommentClient.buildReviewBody(
                savedComments.count { it.severity == ReviewSeverity.HIGH },
                savedComments.count { it.severity == ReviewSeverity.MEDIUM },
                savedComments.count { it.severity == ReviewSeverity.LOW },
                commentItems
            )
            val githubCommentId = vcs.postReviewComment(repoFullName, prNumber, commentBody)

            review = reviewRepository.save(
                review.complete(savedComments, reviewResult.tokensUsed, githubCommentId)
            )
            pipelineRepository.save(startedExecution.complete())
            cache.evict(PipelineCacheService.detailKey(pipelineExecutionId))
            cache.evictByPattern("pipeline:list:*")

            notifyUseCase.onReviewCompleted(
                ReviewCompleted(
                    pipelineExecutionId = pipelineExecutionId,
                    codeReviewId = review.id,
                    highCount = review.highCount,
                    mediumCount = review.mediumCount,
                    lowCount = review.lowCount,
                    prUrl = prUrl,
                    prTitle = prTitle
                )
            )
        } catch (e: Exception) {
            log.error("코드리뷰 실패: pipelineExecutionId=$pipelineExecutionId", e)
            reviewRepository.save(review.fail())
            pipelineRepository.save(startedExecution.fail())
            cache.evict(PipelineCacheService.detailKey(pipelineExecutionId))
        }
    }
}
