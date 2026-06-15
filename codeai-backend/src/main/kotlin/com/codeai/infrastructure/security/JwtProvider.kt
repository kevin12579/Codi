package com.codeai.infrastructure.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtProvider(
    @Value("\${codeai.jwt.secret}") private val secret: String,
    @Value("\${codeai.jwt.expiration-ms}") private val expirationMs: Long
) {
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray(Charsets.UTF_8))
    }

    fun generate(userId: Long, email: String): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expirationMs))
            .signWith(key)
            .compact()

    fun validate(token: String): Boolean = runCatching {
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token)
        true
    }.getOrDefault(false)

    fun getUserId(token: String): Long =
        Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).payload.subject.toLong()

    fun getEmail(token: String): String =
        Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).payload["email"] as String
}
