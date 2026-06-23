package com.codeai.infrastructure.persistence.connector

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "connectors")
class ConnectorEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val category: String,

    @Column(name = "provider_id", nullable = false)
    val providerId: String,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = false,

    @Column(name = "config_json")
    var configJson: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
