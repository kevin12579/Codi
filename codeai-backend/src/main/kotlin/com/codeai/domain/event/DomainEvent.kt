package com.codeai.domain.event

import java.time.LocalDateTime

interface DomainEvent {
    val occurredAt: LocalDateTime
}
