package com.codeai.infrastructure.persistence.repository

import com.codeai.domain.repository.Repository
import com.codeai.domain.repository.RepositoryRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository as SpringRepository

@SpringRepository
class RepositoryRepositoryImpl(
    private val jpa: RepositoryJpaRepository
) : RepositoryRepository {

    override suspend fun findByGithubRepoId(githubRepoId: Long): Repository? =
        withContext(Dispatchers.IO) {
            jpa.findByGithubRepoId(githubRepoId).orElse(null)?.toDomain()
        }

    override suspend fun findByFullName(fullName: String): Repository? =
        withContext(Dispatchers.IO) {
            jpa.findByFullName(fullName).orElse(null)?.toDomain()
        }

    override suspend fun save(repo: Repository): Repository =
        withContext(Dispatchers.IO) {
            jpa.save(RepositoryEntity.from(repo)).toDomain()
        }
}
