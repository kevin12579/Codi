package com.codeai.infrastructure.persistence.settings

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SettingsStore(private val repo: SettingsJpaRepository) {

    suspend fun get(key: String): String? = withContext(Dispatchers.IO) {
        repo.findById(key).orElse(null)?.value
    }

    suspend fun set(key: String, value: String) = withContext(Dispatchers.IO) {
        // 기존 row 의 category/is_encrypted 메타데이터를 보존하며 값만 갱신한다.
        val existing = repo.findById(key).orElse(null)
        repo.save(
            SettingsEntity(
                key = key,
                value = value,
                category = existing?.category,
                isEncrypted = existing?.isEncrypted ?: false,
                updatedAt = LocalDateTime.now()
            )
        )
    }

    /** 쉼표로 구분된 다중값 설정을 리스트로 반환한다. (예: notify.channels = "slack,discord") */
    suspend fun getList(key: String): List<String> =
        get(key)?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() } ?: emptyList()
}
