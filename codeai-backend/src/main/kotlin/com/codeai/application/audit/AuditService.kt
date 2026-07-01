package com.codeai.application.audit

import com.codeai.domain.audit.AuditLog
import com.codeai.domain.audit.AuditLogRepository
import kotlinx.coroutines.reactive.awaitFirstOrNull
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.stereotype.Service

/**
 * 감사 로그 기록 헬퍼 (v0.8/0.9 §2-3, D11).
 * - 감사 기록 실패는 본 비즈니스 흐름을 절대 깨지 않는다(runCatching).
 * - actorId 미지정 시 ReactiveSecurityContextHolder 에서 현재 사용자(JWT principal=userId)를 해석한다.
 */
@Service
class AuditService(
    private val repository: AuditLogRepository
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun record(
        action: String,
        target: String? = null,
        detail: String? = null,
        actorId: Long? = null,
        ip: String? = null,
        userAgent: String? = null
    ) {
        runCatching {
            val resolvedActor = actorId ?: currentActorId()
            repository.save(
                AuditLog(
                    actorId = resolvedActor,
                    action = action,
                    target = target,
                    ip = ip,
                    userAgent = userAgent,
                    detail = detail
                )
            )
        }.onFailure { log.warn("audit 기록 실패: action=$action, target=$target", it) }
    }

    private suspend fun currentActorId(): Long? =
        ReactiveSecurityContextHolder.getContext()
            .map { it.authentication?.principal as? Long }
            .awaitFirstOrNull()
}
