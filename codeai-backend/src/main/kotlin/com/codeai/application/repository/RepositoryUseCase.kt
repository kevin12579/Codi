package com.codeai.application.repository

import com.codeai.application.audit.AuditService
import com.codeai.domain.audit.AuditAction
import com.codeai.domain.repository.Repository
import com.codeai.domain.repository.RepositoryRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class RepositoryUseCase(
    private val repositoryRepository: RepositoryRepository,
    private val auditService: AuditService,
    @Value("\${codeai.webhook.secret}") private val globalWebhookSecret: String
) {
    suspend fun findAll(): List<Repository> = repositoryRepository.findAll()

    /**
     * 레포 등록 (v0.9 D21, §4-3-1 수동 V1). full_name 으로 등록 → 보안 게이트 통과 대상이 된다.
     * V1 은 전역 WEBHOOK_SECRET 을 안내(per-repo secret + 검증은 V1.x).
     */
    suspend fun register(fullName: String, url: String?, defaultBranch: String?): RepositoryRegisterResult {
        val trimmed = fullName.trim()
        val parts = trimmed.split("/")
        require(parts.size == 2 && parts.all { it.isNotBlank() }) {
            "full_name 은 'owner/repo' 형식이어야 합니다: $trimmed"
        }
        repositoryRepository.findByFullName(trimmed)?.let {
            return RepositoryRegisterResult(it, globalWebhookSecret, alreadyExists = true)
        }

        val saved = repositoryRepository.save(
            Repository(
                githubRepoId = null,
                owner = parts[0],
                name = parts[1],
                fullName = trimmed,
                webhookSecret = globalWebhookSecret,
                url = url ?: "https://github.com/$trimmed",
                defaultBranch = defaultBranch?.takeIf { it.isNotBlank() } ?: "main",
                isActive = true,
                connectMode = "MANUAL"
            )
        )
        auditService.record(action = AuditAction.REPO_REGISTER, target = "repository:${saved.id}", detail = "fullName=$trimmed")
        return RepositoryRegisterResult(saved, globalWebhookSecret, alreadyExists = false)
    }

    /** 활성/비활성 토글 (보안 게이트 — 비활성 레포의 Webhook 은 무시됨) */
    suspend fun toggleActive(id: Long, active: Boolean): Repository? {
        val repo = repositoryRepository.findById(id) ?: return null
        val updated = repositoryRepository.save(repo.copy(isActive = active))
        auditService.record(
            action = AuditAction.REPO_TOGGLE,
            target = "repository:$id",
            detail = "isActive=$active"
        )
        return updated
    }
}

data class RepositoryRegisterResult(
    val repository: Repository,
    val webhookSecret: String,
    val alreadyExists: Boolean
)
