package com.codeai.infrastructure.pipeline

import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.pipeline.PipelineStatus
import com.codeai.infrastructure.cache.PipelineCacheService
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDateTime

/**
 * 고아(stuck) 파이프라인 회수기.
 *
 * 앱이 파이프라인 처리 도중 재시작/크래시되면 해당 실행이 PENDING/RUNNING 상태로 영원히 남는다
 * (관측 사례: 20일 넘게 RUNNING 으로 방치 → 대시보드 '실행 중' 카운트 영구 왜곡).
 * 일정 시간(기본 30분) 넘게 진행중인 파이프라인을 FAILED 로 정리한다.
 *
 * 파이프라인 정상 처리는 수 초~수 분이므로 30분 임계값이면 진행중 작업을 오탐할 위험이 없다.
 */
@Component
class StalePipelineReaper(
    private val pipelineRepository: PipelineRepository,
    private val cache: PipelineCacheService,
    @Value("\${codeai.pipeline.stale-timeout-minutes:30}") private val timeoutMinutes: Long,
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    @Scheduled(fixedDelayString = "\${codeai.pipeline.reaper-interval-ms:600000}", initialDelay = 60000)
    fun reap() = runBlocking {
        val cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes)
        val stale = pipelineRepository.findStale(
            listOf(PipelineStatus.PENDING, PipelineStatus.RUNNING), cutoff
        )
        if (stale.isEmpty()) return@runBlocking

        stale.forEach { execution ->
            pipelineRepository.save(execution.fail())
            cache.evict(PipelineCacheService.detailKey(execution.id))
            log.warn(
                "고아 파이프라인 회수(FAILED): id={}, status={}, createdAt={}",
                execution.id, execution.status, execution.createdAt
            )
        }
        cache.evictByPattern("pipeline:list:*")
        log.info("stuck 파이프라인 {}건 정리 완료 (cutoff={})", stale.size, cutoff)
    }
}
