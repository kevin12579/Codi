package com.codeai.infrastructure.persistence.user

import com.codeai.domain.user.User
import com.codeai.domain.user.UserRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository

@Repository
class UserRepositoryImpl(private val jpa: UserJpaRepository) : UserRepository {

    override suspend fun save(user: User): User =
        withContext(Dispatchers.IO) { jpa.save(UserEntity.from(user)).toDomain() }

    override suspend fun findByEmail(email: String): User? =
        withContext(Dispatchers.IO) { jpa.findByEmail(email).orElse(null)?.toDomain() }

    override suspend fun findById(id: Long): User? =
        withContext(Dispatchers.IO) { jpa.findById(id).orElse(null)?.toDomain() }

    override suspend fun existsByEmail(email: String): Boolean =
        withContext(Dispatchers.IO) { jpa.existsByEmail(email) }
}
