package com.codeai.presentation.auth

import com.codeai.application.auth.AuthResult
import java.time.LocalDateTime

data class LoginResponse(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long
) {
    companion object {
        fun from(r: AuthResult, expiresInSeconds: Long) = LoginResponse(
            accessToken = r.token,
            expiresIn = expiresInSeconds
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
