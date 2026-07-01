package com.codeai.application.audit

import com.codeai.domain.audit.AuditLogRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * 감사 로그 조회 (ADMIN). GET /api/audit-logs (v0.8/0.9 §2-3).
 * 필터: action, actorId, from, to (ISO date 또는 datetime), 페이지.
 */
@Service
class AuditQueryUseCase(
    private val repository: AuditLogRepository
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun search(
        action: String?, actorId: Long?, from: String?, to: String?, page: Int, size: Int
    ): AuditLogPageDto {
        val fromDt = parseDateTime(from, endOfDay = false)
        val toDt = parseDateTime(to, endOfDay = true)
        val pageSize = size.coerceIn(1, 200)
        val items = repository.search(action?.takeIf { it.isNotBlank() }, actorId, fromDt, toDt, page, pageSize)
        val total = repository.count(action?.takeIf { it.isNotBlank() }, actorId, fromDt, toDt)
        val fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
        return AuditLogPageDto(
            content = items.map {
                AuditLogDto(
                    id = it.id, actorId = it.actorId, action = it.action,
                    target = it.target, ip = it.ip, detail = it.detail,
                    createdAt = it.createdAt.format(fmt)
                )
            },
            totalElements = total,
            page = page,
            size = pageSize
        )
    }

    /** ISO 날짜('2026-06-30') 또는 datetime 파싱. 날짜만 오면 to 는 그날 끝(+1일)으로 처리. */
    private fun parseDateTime(value: String?, endOfDay: Boolean): LocalDateTime? {
        if (value.isNullOrBlank()) return null
        return runCatching { LocalDateTime.parse(value) }
            .recoverCatching {
                val d = LocalDate.parse(value)
                if (endOfDay) d.plusDays(1).atStartOfDay() else d.atStartOfDay()
            }
            .onFailure { log.warn("audit 필터 날짜 파싱 실패: $value") }
            .getOrNull()
    }
}

data class AuditLogDto(
    val id: Long,
    val actorId: Long?,
    val action: String,
    val target: String?,
    val ip: String?,
    val detail: String?,
    val createdAt: String
)

data class AuditLogPageDto(
    val content: List<AuditLogDto>,
    val totalElements: Long,
    val page: Int,
    val size: Int
)
