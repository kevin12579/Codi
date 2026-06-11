package com.codeai.infrastructure.queue

import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.core.ReactiveRedisTemplate
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class RedisStreamProducer(
    private val redisTemplate: ReactiveRedisTemplate<String, String>
) {
    fun publish(eventData: Map<String, String>): Mono<String> {
        val record = MapRecord.create(RedisStreamConfig.STREAM_KEY, eventData)
        return redisTemplate.opsForStream<String, String>()
            .add(record)
            .map { it.value }
    }
}
