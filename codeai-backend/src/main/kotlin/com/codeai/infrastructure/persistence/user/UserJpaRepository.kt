package com.codeai.infrastructure.persistence.user

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserJpaRepository : JpaRepository<UserEntity, Long> {
    fun findByEmail(email: String): Optional<UserEntity>
    fun existsByEmail(email: String): Boolean
}
