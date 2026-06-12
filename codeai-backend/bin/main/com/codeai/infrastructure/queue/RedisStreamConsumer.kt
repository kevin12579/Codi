package com.codeai.infrastructure.queue

import com.codeai.application.review.ReviewUseCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
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
    private val reviewUseCase: ReviewUseCase
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

                scope.launch {
                    try {
                        log.info("Pipeline 처리 시작: executionId=$pipelineExecutionId")
                        reviewUseCase.execute(
                            pipelineExecutionId = pipelineExecutionId,
                            repoFullName = data["repoFullName"] ?: "",
                            prNumber = data["prNumber"]?.toInt() ?: 0,
                            headSha = data["headSha"] ?: "",
                            prUrl = data["prUrl"] ?: "",
                            prTitle = data["prTitle"] ?: ""
                        )
                        ackMessage(record)
                    } catch (e: Exception) {
                        log.error("Pipeline 처리 실패: executionId=$pipelineExecutionId", e)
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
