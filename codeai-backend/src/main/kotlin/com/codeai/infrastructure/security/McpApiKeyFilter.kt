package com.codeai.infrastructure.security

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono

class McpApiKeyFilter(
    private val apiKey: String,
    private val objectMapper: ObjectMapper
) : WebFilter {

    private val mcpPaths = setOf("/sse", "/mcp/message")

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        if (exchange.request.path.value() !in mcpPaths) return chain.filter(exchange)
        if (apiKey.isBlank()) return chain.filter(exchange)

        val provided = exchange.request.headers.getFirst("X-Api-Key")
        if (provided == apiKey) return chain.filter(exchange)

        val body = objectMapper.writeValueAsBytes(
            mapOf("success" to false, "error" to mapOf("code" to "UNAUTHORIZED", "message" to "MCP API 키가 올바르지 않습니다"))
        )
        exchange.response.statusCode = HttpStatus.UNAUTHORIZED
        exchange.response.headers.contentType = MediaType.APPLICATION_JSON
        return exchange.response.writeWith(
            Mono.just(exchange.response.bufferFactory().wrap(body))
        )
    }
}
