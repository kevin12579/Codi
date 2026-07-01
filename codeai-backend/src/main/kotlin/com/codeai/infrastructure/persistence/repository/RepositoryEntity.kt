package com.codeai.infrastructure.persistence.repository

import com.codeai.domain.repository.Repository
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "repositories")
class RepositoryEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "github_repo_id", unique = true)
    val githubRepoId: Long? = null,

    @Column(nullable = false)
    val owner: String,

    @Column(nullable = false)
    val name: String,

    @Column(name = "full_name", nullable = false, unique = true)
    val fullName: String,

    @Column(name = "webhook_secret", nullable = false)
    val webhookSecret: String,

    @Column(name = "vcs_id", nullable = false)
    val vcsId: String = "github",

    @Column
    val url: String? = null,

    @Column(name = "default_branch", nullable = false)
    val defaultBranch: String = "main",

    @Column(name = "is_active", nullable = false)
    val isActive: Boolean = true,

    @Column(name = "connect_mode", nullable = false)
    val connectMode: String = "MANUAL",

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = Repository(
        id = id, githubRepoId = githubRepoId, owner = owner,
        name = name, fullName = fullName, webhookSecret = webhookSecret,
        vcsId = vcsId, url = url, defaultBranch = defaultBranch,
        isActive = isActive, connectMode = connectMode, createdAt = createdAt
    )

    companion object {
        fun from(d: Repository) = RepositoryEntity(
            id = d.id, githubRepoId = d.githubRepoId, owner = d.owner,
            name = d.name, fullName = d.fullName, webhookSecret = d.webhookSecret,
            vcsId = d.vcsId, url = d.url, defaultBranch = d.defaultBranch,
            isActive = d.isActive, connectMode = d.connectMode, createdAt = d.createdAt
        )
    }
}
