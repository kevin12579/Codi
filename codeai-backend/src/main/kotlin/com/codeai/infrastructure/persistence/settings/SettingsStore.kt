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
        repo.save(SettingsEntity(key, value, LocalDateTime.now()))
    }
}
