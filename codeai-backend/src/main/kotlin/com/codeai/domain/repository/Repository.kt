package com.codeai.domain.repository

import java.time.LocalDateTime

data class Repository(
    val id: Long = 0,
    val githubRepoId: Long,
    val owner: String,
    val name: String,
    val fullName: String,
    val webhookSecret: String,
    val vcsId: String = "github",
    val url: String? = null,
    val defaultBranch: String = "main",
    val isActive: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
