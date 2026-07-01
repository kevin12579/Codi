package com.codeai.domain.admin

import java.time.LocalDateTime

data class UserActivityLog(
    val id: Long = 0,
    val userId: Long?,
    val email: String,
    val action: String,
    val result: String,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

interface UserActivityLogRepository {
    suspend fun save(log: UserActivityLog): UserActivityLog
    suspend fun findAll(): List<UserActivityLog>
}
