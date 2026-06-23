package com.codeai.infrastructure.persistence.admin

import com.codeai.domain.admin.UserActivityLog
import com.codeai.domain.admin.UserActivityLogRepository
import jakarta.persistence.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Entity
@Table(name = "user_activity_logs")
class UserActivityLogEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id")
    val userId: Long?,

    @Column(nullable = false)
    val email: String,

    @Column(nullable = false)
    val action: String,

    @Column(nullable = false)
    val result: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = UserActivityLog(id, userId, email, action, result, createdAt)

    companion object {
        fun from(d: UserActivityLog) =
            UserActivityLogEntity(d.id, d.userId, d.email, d.action, d.result, d.createdAt)
    }
}

interface UserActivityLogJpaRepository : JpaRepository<UserActivityLogEntity, Long> {
    fun findAllByOrderByCreatedAtDesc(): List<UserActivityLogEntity>
}

@Repository
class UserActivityLogRepositoryImpl(
    private val jpa: UserActivityLogJpaRepository
) : UserActivityLogRepository {

    override suspend fun save(log: UserActivityLog): UserActivityLog =
        withContext(Dispatchers.IO) { jpa.save(UserActivityLogEntity.from(log)).toDomain() }

    override suspend fun findAll(): List<UserActivityLog> =
        withContext(Dispatchers.IO) { jpa.findAllByOrderByCreatedAtDesc().map { it.toDomain() } }
}
