package com.codeai.infrastructure.persistence.connector

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface ConnectorJpaRepository : JpaRepository<ConnectorEntity, Long> {
    fun findByCategoryAndProviderId(category: String, providerId: String): Optional<ConnectorEntity>
    fun findByCategory(category: String): List<ConnectorEntity>
}
