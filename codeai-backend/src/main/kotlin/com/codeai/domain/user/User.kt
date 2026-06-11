package com.codeai.domain.user

import java.time.LocalDateTime

enum class UserRole { USER, ADMIN }

data class User(
    val id: Long = 0,
    val email: String,
    val password: String,
    val name: String,
    val role: UserRole = UserRole.USER,
    val isActive: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
