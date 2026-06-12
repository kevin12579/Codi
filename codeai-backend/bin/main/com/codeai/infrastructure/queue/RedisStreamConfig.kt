package com.codeai.infrastructure.queue

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.stream.ReadOffset
import org.springframework.data.redis.core.ReactiveRedisTemplate

@Configuration
class RedisStreamConfig(
    private val redisTemplate: ReactiveRedisTemplate<String, String>
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    companion object {
        const val STREAM_KEY = "codeai:webhook:events"
        const val GROUP_NAME = "pipeline-workers"
        const val CONSUMER_NAME = "worker-1"
    }

    @PostConstruct
    fun ensureConsumerGroup() {
        redisTemplate.opsForStream<String, String>()
            .createGroup(STREAM_KEY, ReadOffset.from("0"), GROUP_NAME)
            .doOnError { e ->
                if (e.message?.contains("BUSYGROUP") == true) {
                    log.debug("Consumer group already exists: $GROUP_NAME")
                } else {
                    log.warn("Failed to create consumer group: ${e.message}")
                }
            }
            .onErrorComplete()
            .subscribe()
    }
}
