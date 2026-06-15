package com.codeai.infrastructure.persistence.settings

import org.springframework.data.jpa.repository.JpaRepository

interface SettingsJpaRepository : JpaRepository<SettingsEntity, String>
