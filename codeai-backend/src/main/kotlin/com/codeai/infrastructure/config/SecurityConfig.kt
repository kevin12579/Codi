package com.codeai.infrastructure.config

import com.codeai.infrastructure.security.JwtAuthFilter
import com.codeai.infrastructure.security.McpApiKeyFilter
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.buffer.DefaultDataBufferFactory
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain
import reactor.core.publisher.Mono

@Configuration
@EnableWebFluxSecurity
class SecurityConfig(
    private val jwtAuthFilter: JwtAuthFilter,
    private val objectMapper: ObjectMapper,
    @Value("\${codeai.api.key:}") private val mcpApiKey: String
) {

    @Bean
    fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain =
        http
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .authorizeExchange { auth ->
                auth
                    .pathMatchers(
                        "/api/auth/register",
                        "/api/auth/signup",
                        "/api/auth/login",
                        "/webhook/**",
                        "/actuator/health",
                        "/actuator/health/**",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/api-docs",
                        "/api-docs/**",
                        "/webjars/**"
                    ).permitAll()
                    // MCP 엔드포인트: X-Api-Key 헤더로 별도 인증 (McpApiKeyFilter)
                    .pathMatchers("/sse", "/mcp/message").permitAll()
                    .anyExchange().authenticated()
            }
            .exceptionHandling { ex ->
                ex.authenticationEntryPoint { exchange, _ ->
                    val body = objectMapper.writeValueAsBytes(
                        mapOf("success" to false, "error" to mapOf("code" to "UNAUTHORIZED", "message" to "인증이 필요합니다"))
                    )
                    exchange.response.statusCode = HttpStatus.UNAUTHORIZED
                    exchange.response.headers.contentType = MediaType.APPLICATION_JSON
                    exchange.response.writeWith(Mono.just(DefaultDataBufferFactory().wrap(body)))
                }
            }
            .addFilterBefore(jwtAuthFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .addFilterBefore(mcpApiKeyFilter(), SecurityWebFiltersOrder.FIRST)
            .build()

    @Bean
    fun mcpApiKeyFilter(): McpApiKeyFilter = McpApiKeyFilter(mcpApiKey, objectMapper)

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(12)
}
