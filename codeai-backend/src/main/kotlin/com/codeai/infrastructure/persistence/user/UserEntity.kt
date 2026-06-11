package com.codeai.infrastructure.persistence.user

import com.codeai.domain.user.User
import com.codeai.domain.user.UserRole
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class UserEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    val password: String,

    @Column(nullable = false)
    val name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: UserRole = UserRole.USER,

    @Column(name = "is_active", nullable = false)
    val isActive: Boolean = true,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = User(
        id = id, email = email, password = password,
        name = name, role = role, isActive = isActive, createdAt = createdAt
    )

    companion object {
        fun from(d: User) = UserEntity(
            id = d.id, email = d.email, password = d.password,
            name = d.name, role = d.role, isActive = d.isActive, createdAt = d.createdAt
        )
    }
}
