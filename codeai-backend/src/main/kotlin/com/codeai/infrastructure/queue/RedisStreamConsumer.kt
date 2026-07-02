package com.codeai.infrastructure.queue

import com.codeai.application.deploy.DeployUseCase
import com.codeai.application.notification.NotifyUseCase
import com.codeai.application.review.ReviewUseCase
import com.codeai.application.testrun.TestRunUseCase
import com.codeai.domain.pipeline.PipelineRepository
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
    private val notifyUseCase: NotifyUseCase,
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
                val prUrl = data["prUrl"] ?: ""
                val prTitle = data["prTitle"] ?: ""

                scope.launch {
                    try {
                        log.info("Pipeline 처리 시작: executionId=$pipelineExecutionId")

                        // 리뷰·테스트를 병렬 실행하고 둘 다 완료(DB 영속)될 때까지 대기.
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
                            reviewJob.await()
                            testJob.await()
                        }

                        // v0.9(D10): 후보 판정 기준을 승인 게이트와 '단일 소스'로 통일한다.
                        // (과거 버그: "리뷰가 에러 없이 끝남"으로만 판정 → HIGH>0 인데도 후보가 됐음)
                        // isEligible = 리뷰 COMPLETED && highCount==0 && 테스트 PASSED — DeployUseCase 와 동일 규칙.
                        val eligible = deployUseCase.isEligible(pipelineExecutionId)
                        pipelineRepository.findById(pipelineExecutionId)?.let { execution ->
                            val finalExecution = if (eligible) execution.markDeployCandidate() else execution.fail()
                            pipelineRepository.save(finalExecution)
                            cache.evict(PipelineCacheService.detailKey(pipelineExecutionId))
                            cache.evictByPattern("pipeline:list:*")
                        }

                        // 배포 후보면 Slack 으로 승인 요청 알림 (실제 배포는 ADMIN 승인 후 DeployUseCase.approveAndDeploy)
                        if (eligible) {
                            notifyUseCase.notifyDeployCandidate(pipelineExecutionId, prTitle, repoFullName)
                        }

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
