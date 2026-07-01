package com.codeai.infrastructure.connector

import com.codeai.infrastructure.persistence.connector.ConnectorEntity
import com.codeai.infrastructure.persistence.connector.ConnectorJpaRepository
import com.codeai.infrastructure.security.AesCryptoService
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime

/**
 * 커넥터 설정(암호화 config)의 저장/조회 담당. (Phase 5)
 *
 * 엔진(plugin/ai)·ConnectorUseCase(application) 양쪽에서 사용하므로 infrastructure 에 둔다.
 * config_json 은 AES-256 으로 암호화되어 저장되며, 조회 시 복호화 후 Map 으로 반환한다.
 */
@Service
class ConnectorConfigService(
    private val repo: ConnectorJpaRepository,
    private val aes: AesCryptoService,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    /** 복호화된 config 맵 (없으면 빈 맵). */
    suspend fun getConfig(category: String, providerId: String): Map<String, String> = withContext(Dispatchers.IO) {
        val entity = repo.findByCategoryAndProviderId(category, providerId).orElse(null)
        val cipher = entity?.configJson ?: return@withContext emptyMap()
        try {
            @Suppress("UNCHECKED_CAST")
            objectMapper.readValue(aes.decrypt(cipher), Map::class.java) as Map<String, String>
        } catch (e: Exception) {
            log.error("커넥터 config 복호화 실패: $category/$providerId — ${e.message}")
            emptyMap()
        }
    }

    suspend fun getApiKey(category: String, providerId: String): String? =
        getConfig(category, providerId)["apiKey"]?.takeIf { it.isNotBlank() }

    suspend fun isConfigured(category: String, providerId: String): Boolean =
        getConfig(category, providerId).values.any { it.isNotBlank() }

    /** config 를 암호화하여 upsert 한다. */
    suspend fun saveConfig(category: String, providerId: String, isActive: Boolean, config: Map<String, String>) =
        withContext(Dispatchers.IO) {
            val cipher = if (config.isEmpty()) null else aes.encrypt(objectMapper.writeValueAsString(config))
            val entity = repo.findByCategoryAndProviderId(category, providerId).orElse(null)
            if (entity == null) {
                repo.save(
                    ConnectorEntity(
                        category = category,
                        providerId = providerId,
                        isActive = isActive,
                        configJson = cipher,
                    )
                )
            } else {
                entity.isActive = isActive
                if (cipher != null) entity.configJson = cipher
                entity.updatedAt = LocalDateTime.now()
                repo.save(entity)
            }
            Unit
        }
}
