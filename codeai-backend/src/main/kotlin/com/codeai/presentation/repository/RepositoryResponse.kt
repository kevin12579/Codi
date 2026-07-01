package com.codeai.presentation.repository

import com.codeai.domain.repository.Repository
import java.time.LocalDateTime

data class RepositoryListResponse(
    val content: List<RepositoryResponse>,
    val totalElements: Int
)

data class RepositoryResponse(
    val id: Long,
    val fullName: String,
    val url: String?,
    val defaultBranch: String,
    val webhookUrl: String,
    val isActive: Boolean,
    val connectMode: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(r: Repository, webhookUrl: String) = RepositoryResponse(
            id = r.id, fullName = r.fullName, url = r.url,
            defaultBranch = r.defaultBranch, webhookUrl = webhookUrl,
            isActive = r.isActive, connectMode = r.connectMode, createdAt = r.createdAt
        )
    }
}

/**
 * 레포 등록 응답 — Webhook URL + Secret 을 1회 발급·안내(GitHub Settings→Webhooks 붙여넣기용). (v0.9 §4-3-1)
 */
data class RepositoryRegisterResponse(
    val id: Long,
    val fullName: String,
    val webhookUrl: String,
    val webhookSecret: String,
    val isActive: Boolean,
    val connectMode: String,
    val alreadyExists: Boolean
) {
    companion object {
        fun from(r: Repository, webhookUrl: String, secret: String, alreadyExists: Boolean) =
            RepositoryRegisterResponse(
                id = r.id, fullName = r.fullName, webhookUrl = webhookUrl,
                webhookSecret = secret, isActive = r.isActive,
                connectMode = r.connectMode, alreadyExists = alreadyExists
            )
    }
}
