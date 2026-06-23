package com.codeai.application.repository

import com.codeai.domain.repository.Repository
import com.codeai.domain.repository.RepositoryRepository
import org.springframework.stereotype.Service

@Service
class RepositoryUseCase(
    private val repositoryRepository: RepositoryRepository
) {
    suspend fun findAll(): List<Repository> = repositoryRepository.findAll()
}
