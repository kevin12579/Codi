package com.codeai.infrastructure.security

import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono

@Component
class JwtAuthFilter(private val jwtProvider: JwtProvider) : WebFilter {

    private val publicPaths = setOf(
        "/api/auth/login",
        "/api/auth/register",
        "/webhook/github",
        "/actuator/health",
        "/swagger-ui.html",
        "/swagger-ui",
        "/api-docs",
        "/webjars"
    )

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        val path = exchange.request.path.value()

        if (publicPaths.any { path.startsWith(it) }) {
            return chain.filter(exchange)
        }

        val token = exchange.request.headers.getFirst(HttpHeaders.AUTHORIZATION)
            ?.takeIf { it.startsWith("Bearer ") }
            ?.removePrefix("Bearer ")

        if (token == null || !jwtProvider.validate(token)) {
            exchange.response.statusCode = HttpStatus.UNAUTHORIZED
            return exchange.response.setComplete()
        }

        return chain.filter(exchange)
    }
}
