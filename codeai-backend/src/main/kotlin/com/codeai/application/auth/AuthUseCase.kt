package com.codeai.application.auth

import com.codeai.application.connector.EmailAlreadyExistsException
import com.codeai.domain.admin.UserActivityLog
import com.codeai.domain.admin.UserActivityLogRepository
import com.codeai.domain.user.User
import com.codeai.domain.user.UserRepository
import com.codeai.infrastructure.security.JwtProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthUseCase(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
    private val activityLogRepository: UserActivityLogRepository,
) {
    suspend fun register(email: String, password: String, name: String): AuthResult {
        if (userRepository.existsByEmail(email)) {
            throw EmailAlreadyExistsException(email)
        }
        val user = userRepository.save(
            User(email = email, password = passwordEncoder.encode(password), name = name)
        )
        val token = jwtProvider.generate(user.id, user.email, user.role)
        return AuthResult(token = token, userId = user.id, email = user.email, name = user.name, createdAt = user.createdAt)
    }

    suspend fun login(email: String, password: String): AuthResult {
        val user = userRepository.findByEmail(email)

        if (user == null || !passwordEncoder.matches(password, user.password) || !user.isActive) {
            runCatching {
                activityLogRepository.save(
                    UserActivityLog(userId = user?.id, email = email, action = "로그인", result = "실패")
                )
            }
            throw IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.")
        }

        val token = jwtProvider.generate(user.id, user.email, user.role)
        runCatching {
            activityLogRepository.save(
                UserActivityLog(userId = user.id, email = user.email, action = "로그인", result = "성공")
            )
        }
        return AuthResult(token = token, userId = user.id, email = user.email, name = user.name)
    }
}

data class AuthResult(
    val token: String,
    val userId: Long,
    val email: String,
    val name: String,
    val createdAt: java.time.LocalDateTime? = null
)
