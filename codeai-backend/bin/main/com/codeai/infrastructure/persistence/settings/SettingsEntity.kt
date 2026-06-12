package com.codeai.infrastructure.persistence.settings

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "system_settings")
data class SettingsEntity(
    @Id val key: String,
    @Column var value: String?,
    @Column(name = "updated_at") var updatedAt: LocalDateTime = LocalDateTime.now()
)
