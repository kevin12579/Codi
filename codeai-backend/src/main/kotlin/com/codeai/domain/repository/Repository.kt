package com.codeai.domain.repository

import java.time.LocalDateTime

data class Repository(
    val id: Long = 0,
    val githubRepoId: Long? = null,          // 수동 등록 시 미상 → 첫 Webhook 에서 백필 (v0.9 D21)
    val owner: String,
    val name: String,
    val fullName: String,
    val webhookSecret: String,
    val vcsId: String = "github",
    val url: String? = null,
    val defaultBranch: String = "main",
    val isActive: Boolean = true,
    val connectMode: String = "MANUAL",      // MANUAL(V1) | AUTO(V2 GitHub App)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
