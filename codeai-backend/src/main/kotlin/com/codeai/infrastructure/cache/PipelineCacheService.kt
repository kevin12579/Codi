package com.codeai.infrastructure.cache

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import kotlinx.coroutines.reactor.awaitSingleOrNull
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.ReactiveRedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class PipelineCacheService(
    private val redis: ReactiveRedisTemplate<String, String>,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val ttl = Duration.ofSeconds(60)

    suspend fun <T> getOrLoad(key: String, type: Class<T>, loader: suspend () -> T): T {
        val cached = redis.opsForValue().get(key).awaitSingleOrNull()
        if (cached != null) {
            return try {
                objectMapper.readValue(cached, type)
            } catch (e: Exception) {
                log.warn("캐시 역직렬화 실패, DB에서 로드: key=$key")
                loadAndCache(key, loader)
            }
        }
        return loadAndCache(key, loader)
    }

    suspend fun evict(key: String) {
        redis.delete(key).awaitSingleOrNull()
    }

    suspend fun evictByPattern(pattern: String) {
        redis.keys(pattern).collectList().awaitSingleOrNull()
            ?.forEach { redis.delete(it).awaitSingleOrNull() }
    }

    private suspend fun <T> loadAndCache(key: String, loader: suspend () -> T): T {
        val value = loader()
        try {
            val json = objectMapper.writeValueAsString(value)
            redis.opsForValue().set(key, json, ttl).awaitSingleOrNull()
        } catch (e: Exception) {
            log.warn("캐시 저장 실패 (무시): key=$key, ${e.message}")
        }
        return value
    }

    companion object {
        fun listKey(status: String?, from: String?, to: String?, page: Int, size: Int, repositoryId: Long? = null) =
            "pipeline:list:${status}:${from}:${to}:${page}:${size}:${repositoryId}"

        fun detailKey(id: Long) = "pipeline:detail:$id"

        fun statsKey(repositoryId: Long? = null, period: String = "7d") = "pipeline:stats:${repositoryId}:${period}"
    }
}
