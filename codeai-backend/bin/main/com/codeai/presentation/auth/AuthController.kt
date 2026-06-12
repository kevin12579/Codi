package com.codeai.presentation.auth

import com.codeai.application.auth.AuthUseCase
import com.codeai.presentation.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

@Tag(name = "인증", description = "회원가입 / 로그인 / 로그아웃 / JWT 발급")
@RestController
@RequestMapping("/api/auth")
class AuthController(private val authUseCase: AuthUseCase) {

    @Operation(summary = "회원가입")
    @PostMapping("/register")
    suspend fun register(@RequestBody req: RegisterRequest): ApiResponse<AuthResponse> {
        val result = authUseCase.register(req.email, req.password, req.name)
        return ApiResponse.ok(AuthResponse.from(result), "회원가입 완료")
    }

    @Operation(summary = "로그인 — JWT 토큰 발급")
    @PostMapping("/login")
    suspend fun login(@RequestBody req: LoginRequest): ApiResponse<AuthResponse> {
        val result = authUseCase.login(req.email, req.password)
        return ApiResponse.ok(AuthResponse.from(result), "로그인 성공")
    }

    @Operation(summary = "로그아웃 — 클라이언트 토큰 폐기 안내")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    suspend fun logout(): ApiResponse<Nothing> =
        ApiResponse.ok("로그아웃 완료. 클라이언트 측에서 토큰을 삭제하세요.")
}
