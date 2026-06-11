package com.codeai.infrastructure.persistence.repository

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface RepositoryJpaRepository : JpaRepository<RepositoryEntity, Long> {
    fun findByGithubRepoId(githubRepoId: Long): Optional<RepositoryEntity>
    fun findByFullName(fullName: String): Optional<RepositoryEntity>
}
