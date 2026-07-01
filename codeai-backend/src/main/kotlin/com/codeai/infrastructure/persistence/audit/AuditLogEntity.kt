package com.codeai.infrastructure.persistence.audit

import com.codeai.domain.audit.AuditLog
import com.codeai.domain.audit.AuditLogRepository
import jakarta.persistence.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Entity
@Table(name = "audit_logs")
class AuditLogEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "actor_id")
    val actorId: Long? = null,

    @Column(nullable = false)
    val action: String,

    @Column
    val target: String? = null,

    @Column
    val ip: String? = null,

    @Column(name = "user_agent")
    val userAgent: String? = null,

    @Column(columnDefinition = "TEXT")
    val detail: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = AuditLog(id, actorId, action, target, ip, userAgent, detail, createdAt)

    companion object {
        fun from(d: AuditLog) =
            AuditLogEntity(d.id, d.actorId, d.action, d.target, d.ip, d.userAgent, d.detail, d.createdAt)
    }
}

interface AuditLogJpaRepository : JpaRepository<AuditLogEntity, Long>, JpaSpecificationExecutor<AuditLogEntity>

@Repository
class AuditLogRepositoryImpl(
    private val jpa: AuditLogJpaRepository
) : AuditLogRepository {

    override suspend fun save(log: AuditLog): AuditLog =
        withContext(Dispatchers.IO) { jpa.save(AuditLogEntity.from(log)).toDomain() }

    override suspend fun search(
        action: String?, actorId: Long?, from: LocalDateTime?, to: LocalDateTime?, page: Int, size: Int
    ): List<AuditLog> = withContext(Dispatchers.IO) {
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 200), Sort.by("createdAt").descending())
        jpa.findAll(spec(action, actorId, from, to), pageable)
            .content.map { it.toDomain() }
    }

    override suspend fun count(action: String?, actorId: Long?, from: LocalDateTime?, to: LocalDateTime?): Long =
        withContext(Dispatchers.IO) { jpa.count(spec(action, actorId, from, to)) }

    private fun spec(action: String?, actorId: Long?, from: LocalDateTime?, to: LocalDateTime?) =
        Specification<AuditLogEntity> { root, _, cb ->
            val preds = mutableListOf<jakarta.persistence.criteria.Predicate>()
            action?.let { preds.add(cb.equal(root.get<String>("action"), it)) }
            actorId?.let { preds.add(cb.equal(root.get<Long>("actorId"), it)) }
            from?.let { preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), it)) }
            to?.let { preds.add(cb.lessThan(root.get("createdAt"), it)) }
            cb.and(*preds.toTypedArray())
        }
}
