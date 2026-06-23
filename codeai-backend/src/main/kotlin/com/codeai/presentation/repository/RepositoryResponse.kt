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
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(r: Repository, webhookUrl: String) = RepositoryResponse(
            id = r.id, fullName = r.fullName, url = r.url,
            defaultBranch = r.defaultBranch, webhookUrl = webhookUrl,
            isActive = r.isActive, createdAt = r.createdAt
        )
    }
}
