package com.codeai.presentation.auth

import com.codeai.application.audit.AuditService
import com.codeai.application.auth.AuthUseCase
import com.codeai.domain.audit.AuditAction
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ServerWebExchange

@Tag(name = "인증", description = "회원가입 / 로그인 / 로그아웃 / JWT 발급")
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authUseCase: AuthUseCase,
    private val auditService: AuditService,
    @Value("\${codeai.jwt.expiration-ms:86400000}") private val expirationMs: Long
) {
    private val expiresInSeconds get() = expirationMs / 1000

    private fun clientIp(exchange: ServerWebExchange) = exchange.request.remoteAddress?.address?.hostAddress
    private fun userAgent(exchange: ServerWebExchange) = exchange.request.headers.getFirst("User-Agent")

    @Operation(summary = "회원가입")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/register", "/signup")
    suspend fun register(@RequestBody req: RegisterRequest): ApiResponse<RegisterResponse> {
        val result = authUseCase.register(req.email, req.password, req.name)
        return ApiResponse.ok(RegisterResponse.from(result), "회원가입 완료")
    }

    @Operation(summary = "로그인 — JWT 토큰 발급")
    @PostMapping("/login")
    suspend fun login(@RequestBody req: LoginRequest, exchange: ServerWebExchange): ApiResponse<LoginResponse> {
        val result = authUseCase.login(req.email, req.password)
        auditService.record(
            action = AuditAction.LOGIN, target = "user:${result.userId}", detail = result.email,
            actorId = result.userId, ip = clientIp(exchange), userAgent = userAgent(exchange)
        )
        return ApiResponse.ok(LoginResponse.from(result, expiresInSeconds), "로그인 성공")
    }

    @Operation(summary = "비밀번호 변경")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/password")
    suspend fun changePassword(@RequestBody req: PasswordChangeRequest): ApiResponse<Nothing> {
        val userId = ReactiveSecurityContextHolder.getContext()
            .map { it.authentication?.principal as? Long ?: throw IllegalStateException("인증 정보가 없습니다.") }
            .awaitSingle()
        authUseCase.changePassword(userId, req.currentPassword, req.newPassword)
        return ApiResponse.ok("비밀번호가 변경되었습니다.")
    }

    @Operation(summary = "로그아웃 — 클라이언트 토큰 폐기 안내")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    suspend fun logout(exchange: ServerWebExchange): ApiResponse<Nothing> {
        auditService.record(action = AuditAction.LOGOUT, ip = clientIp(exchange), userAgent = userAgent(exchange))
        return ApiResponse.ok("로그아웃 완료. 클라이언트 측에서 토큰을 삭제하세요.")
    }
}
