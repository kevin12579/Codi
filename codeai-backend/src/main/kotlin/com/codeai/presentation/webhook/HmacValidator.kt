package com.codeai.presentation.webhook

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Component
class HmacValidator(
    @Value("\${codeai.webhook.secret}") private val secret: String
) {
    fun validate(payload: String, signature: String): Boolean {
        if (signature.isBlank()) return false
        return try {
            val mac = Mac.getInstance("HmacSHA256")
            val key = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
            mac.init(key)
            val calculated = "sha256=" + mac.doFinal(payload.toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it) }
            calculated == signature
        } catch (e: Exception) {
            false
        }
    }
}
