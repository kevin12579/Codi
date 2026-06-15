package com.codeai.domain.repository

interface RepositoryRepository {
    suspend fun findByGithubRepoId(githubRepoId: Long): Repository?
    suspend fun findByFullName(fullName: String): Repository?
    suspend fun findAll(): List<Repository>
    suspend fun save(repo: Repository): Repository
}
