package com.codeai.presentation.auth

import com.codeai.application.auth.AuthResult
import java.time.LocalDateTime

data class LoginResponse(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val role: String
) {
    companion object {
        fun from(r: AuthResult, expiresInSeconds: Long) = LoginResponse(
            accessToken = r.token,
            expiresIn = expiresInSeconds,
            role = r.role
        )
    }
}

data class PasswordChangeRequest(val currentPassword: String, val newPassword: String)

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
