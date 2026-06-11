package com.codeai.presentation.auth

import com.codeai.application.auth.AuthResult

data class AuthResponse(
    val token: String,
    val tokenType: String = "Bearer",
    val userId: Long,
    val email: String,
    val name: String
) {
    companion object {
        fun from(r: AuthResult) = AuthResponse(
            token = r.token, userId = r.userId, email = r.email, name = r.name
        )
    }
}
