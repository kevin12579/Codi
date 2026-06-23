package com.codeai.infrastructure.queue

import com.codeai.application.deploy.DeployUseCase
import com.codeai.application.review.ReviewUseCase
import com.codeai.application.testrun.TestRunUseCase
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.testrun.TestRunStatus
import com.codeai.infrastructure.cache.PipelineCacheService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import org.springframework.data.redis.connection.stream.Consumer
import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.connection.stream.ReadOffset
import org.springframework.data.redis.connection.stream.StreamOffset
import org.springframework.data.redis.core.ReactiveRedisTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class RedisStreamConsumer(
    private val redisTemplate: ReactiveRedisTemplate<String, String>,
    private val reviewUseCase: ReviewUseCase,
    private val testRunUseCase: TestRunUseCase,
    private val deployUseCase: DeployUseCase,
    private val pipelineRepository: PipelineRepository,
    private val cache: PipelineCacheService,
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val scope = CoroutineScope(Dispatchers.IO)

    @Scheduled(fixedDelay = 1000)
    fun consume() {
        redisTemplate.opsForStream<String, String>()
            .read(
                Consumer.from(RedisStreamConfig.GROUP_NAME, RedisStreamConfig.CONSUMER_NAME),
                StreamOffset.create(RedisStreamConfig.STREAM_KEY, ReadOffset.lastConsumed())
            )
            .subscribe { record ->
                val data = record.value
                val pipelineExecutionId = data["pipelineExecutionId"]?.toLong() ?: return@subscribe
                val repoFullName = data["repoFullName"] ?: ""
                val prNumber = data["prNumber"]?.toInt() ?: 0
                val headSha = data["headSha"] ?: ""
                val headRef = data["headRef"] ?: ""
                val prUrl = data["prUrl"] ?: ""
                val prTitle = data["prTitle"] ?: ""

                scope.launch {
                    try {
                        log.info("Pipeline 처리 시작: executionId=$pipelineExecutionId")

                        val reviewOk: Boolean
                        val testOk: Boolean
                        coroutineScope {
                            val reviewJob = async {
                                reviewUseCase.execute(
                                    pipelineExecutionId = pipelineExecutionId,
                                    repoFullName = repoFullName,
                                    prNumber = prNumber,
                                    headSha = headSha,
                                    prUrl = prUrl,
                                    prTitle = prTitle
                                )
                            }
                            val testJob = async {
                                testRunUseCase.runTests(
                                    pipelineExecutionId = pipelineExecutionId,
                                    headSha = headSha
                                )
                            }
                            reviewOk = reviewJob.await()
                            testOk = testJob.await().status == TestRunStatus.PASSED
                        }

                        // 리뷰 + 테스트 두 결과를 종합해 파이프라인 최종 status 결정
                        pipelineRepository.findById(pipelineExecutionId)?.let { execution ->
                            val finalExecution = if (reviewOk && testOk) execution.complete() else execution.fail()
                            pipelineRepository.save(finalExecution)
                            cache.evict(PipelineCacheService.detailKey(pipelineExecutionId))
                            cache.evictByPattern("pipeline:list:*")
                        }

                        deployUseCase.triggerIfEligible(
                            pipelineExecutionId = pipelineExecutionId,
                            repoFullName = repoFullName,
                            ref = headRef.ifBlank { headSha }
                        )

                        ackMessage(record)
                        log.info("Pipeline 처리 완료: executionId=$pipelineExecutionId")
                    } catch (e: Exception) {
                        log.error("Pipeline 처리 실패: executionId=$pipelineExecutionId", e)
                        ackMessage(record)
                    }
                }
            }
    }

    private fun ackMessage(record: MapRecord<String, String, String>) {
        redisTemplate.opsForStream<String, String>()
            .acknowledge(RedisStreamConfig.GROUP_NAME, record)
            .subscribe()
    }
}
