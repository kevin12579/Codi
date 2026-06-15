package com.codeai.presentation.auth

import com.codeai.application.auth.AuthResult
import java.time.LocalDateTime

data class LoginResponse(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val userId: Long,
    val email: String,
    val name: String
) {
    companion object {
        fun from(r: AuthResult, expiresInSeconds: Long) = LoginResponse(
            accessToken = r.token,
            expiresIn = expiresInSeconds,
            userId = r.userId,
            email = r.email,
            name = r.name
        )
    }
}

data class RegisterResponse(
    val id: Long,
    val email: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(r: AuthResult) = RegisterResponse(
            id = r.userId,
            email = r.email,
            createdAt = r.createdAt ?: LocalDateTime.now()
        )
    }
}
