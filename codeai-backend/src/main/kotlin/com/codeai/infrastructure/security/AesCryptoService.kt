package com.codeai.infrastructure.security

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * 커넥터 API 키 등 시크릿을 AES-256-GCM 으로 암복호화한다. (변경종합 §2-7)
 *
 * 키 파생: 환경변수 시크릿을 SHA-256 해시해 32바이트 AES 키로 사용(임의 길이 시크릿 허용).
 * 출력 형식: Base64(IV(12) || ciphertext+tag).
 */
@Service
class AesCryptoService(
    @Value("\${codeai.aes.secret:}") secret: String,
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val keySpec: SecretKeySpec

    init {
        val raw = secret.ifBlank {
            log.warn("AES_SECRET_KEY 미설정 — dev 기본키 사용(운영 환경에서는 반드시 설정).")
            "codeai-dev-default-aes-secret-change-me"
        }
        val sha256 = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray(Charsets.UTF_8))
        keySpec = SecretKeySpec(sha256, "AES")
    }

    fun encrypt(plain: String): String {
        val iv = ByteArray(IV_LEN).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance(TRANSFORM)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, GCMParameterSpec(TAG_BITS, iv))
        val cipherText = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
        return Base64.getEncoder().encodeToString(iv + cipherText)
    }

    fun decrypt(encoded: String): String {
        val data = Base64.getDecoder().decode(encoded)
        val iv = data.copyOfRange(0, IV_LEN)
        val cipherText = data.copyOfRange(IV_LEN, data.size)
        val cipher = Cipher.getInstance(TRANSFORM)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, GCMParameterSpec(TAG_BITS, iv))
        return String(cipher.doFinal(cipherText), Charsets.UTF_8)
    }

    companion object {
        private const val TRANSFORM = "AES/GCM/NoPadding"
        private const val IV_LEN = 12
        private const val TAG_BITS = 128
    }
}
