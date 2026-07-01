package com.codeai.domain.audit

import java.time.LocalDateTime

/**
 * 보안/행위 감사 이력 (v0.8/0.9 §2-3). 누가(actorId)·언제(createdAt)·무엇을(action/target)·어디서(ip).
 * 시스템 행위는 actorId = null.
 */
data class AuditLog(
    val id: Long = 0,
    val actorId: Long? = null,
    val action: String,
    val target: String? = null,
    val ip: String? = null,
    val userAgent: String? = null,
    val detail: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

/** 표준 action 상수 (설계 §3 audit_logs). 자유 문자열이지만 일관성을 위해 상수 사용. */
object AuditAction {
    const val LOGIN = "LOGIN"
    const val LOGOUT = "LOGOUT"
    const val CONNECTOR_UPDATE = "CONNECTOR_UPDATE"
    const val DEPLOY_APPROVE = "DEPLOY_APPROVE"
    const val REPO_REGISTER = "REPO_REGISTER"
    const val REPO_TOGGLE = "REPO_TOGGLE"
    const val MCP_TOOL_CALL = "MCP_TOOL_CALL"
}

interface AuditLogRepository {
    suspend fun save(log: AuditLog): AuditLog
    suspend fun search(action: String?, actorId: Long?, from: LocalDateTime?, to: LocalDateTime?, page: Int, size: Int): List<AuditLog>
    suspend fun count(action: String?, actorId: Long?, from: LocalDateTime?, to: LocalDateTime?): Long
}
