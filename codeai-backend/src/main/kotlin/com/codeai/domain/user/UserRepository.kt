package com.codeai.domain.user

interface UserRepository {
    suspend fun save(user: User): User
    suspend fun findByEmail(email: String): User?
    suspend fun findById(id: Long): User?
    suspend fun existsByEmail(email: String): Boolean
}
