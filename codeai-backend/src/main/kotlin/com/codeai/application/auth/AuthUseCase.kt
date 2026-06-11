package com.codeai.application.auth

import com.codeai.domain.user.User
import com.codeai.domain.user.UserRepository
import com.codeai.infrastructure.security.JwtProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthUseCase(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider
) {
    suspend fun register(email: String, password: String, name: String): AuthResult {
        if (userRepository.existsByEmail(email)) {
            throw IllegalArgumentException("이미 사용 중인 이메일입니다: $email")
        }
        val user = userRepository.save(
            User(email = email, password = passwordEncoder.encode(password), name = name)
        )
        val token = jwtProvider.generate(user.id, user.email)
        return AuthResult(token = token, userId = user.id, email = user.email, name = user.name)
    }

    suspend fun login(email: String, password: String): AuthResult {
        val user = userRepository.findByEmail(email)
            ?: throw IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.")

        if (!passwordEncoder.matches(password, user.password)) {
            throw IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.")
        }
        if (!user.isActive) {
            throw IllegalArgumentException("비활성화된 계정입니다.")
        }

        val token = jwtProvider.generate(user.id, user.email)
        return AuthResult(token = token, userId = user.id, email = user.email, name = user.name)
    }
}

data class AuthResult(
    val token: String,
    val userId: Long,
    val email: String,
    val name: String
)
