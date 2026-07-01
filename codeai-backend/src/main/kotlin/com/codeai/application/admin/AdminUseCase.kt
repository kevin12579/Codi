package com.codeai.application.admin

import com.codeai.domain.admin.UserActivityLogRepository
import com.codeai.domain.pipeline.PipelineStatus
import com.codeai.infrastructure.persistence.pipeline.PipelineExecutionJpaRepository
import com.codeai.infrastructure.persistence.user.UserJpaRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class AdminUseCase(
    private val userJpa: UserJpaRepository,
    private val pipelineJpa: PipelineExecutionJpaRepository,
    private val activityLogRepository: UserActivityLogRepository,
) {
    suspend fun getStats(): AdminStatsDto = withContext(Dispatchers.IO) {
        val totalUsers = userJpa.count()
        val monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay()
        val monthlyNewUsers = userJpa.countByCreatedAtAfter(monthStart)
        val activePipelines = pipelineJpa.countByStatus(PipelineStatus.PENDING) +
                pipelineJpa.countByStatus(PipelineStatus.RUNNING)
        val since24h = LocalDateTime.now().minusHours(24)
        val recentErrors = pipelineJpa.countByStatusAndCreatedAtAfter(PipelineStatus.FAILED, since24h)

        AdminStatsDto(
            totalUsers = totalUsers,
            monthlyNewUsers = monthlyNewUsers,
            activePipelines = activePipelines,
            recentErrors = recentErrors
        )
    }

    suspend fun getPipelineHourly(): List<HourlyStatDto> = withContext(Dispatchers.IO) {
        val todayStart = LocalDate.now().atStartOfDay()
        val todayEnd = todayStart.plusDays(1)
        val executions = pipelineJpa.findByCreatedAtBetweenOrderByCreatedAtAsc(todayStart, todayEnd)
        val hourlyMap = executions.groupBy { it.createdAt.hour }.mapValues { it.value.size.toLong() }

        (0..23).map { h ->
            HourlyStatDto(
                time = "${h.toString().padStart(2, '0')}시",
                count = hourlyMap[h] ?: 0L
            )
        }
    }

    suspend fun getUserLogs(): List<UserLogDto> {
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
        return activityLogRepository.findAll().map { log ->
            UserLogDto(
                id = log.id,
                date = log.createdAt.format(formatter),
                email = log.email,
                action = log.action,
                result = log.result
            )
        }
    }
}

data class AdminStatsDto(
    val totalUsers: Long,
    val monthlyNewUsers: Long,
    val activePipelines: Long,
    val recentErrors: Long
)

data class HourlyStatDto(val time: String, val count: Long)

data class UserLogDto(
    val id: Long,
    val date: String,
    val email: String,
    val action: String,
    val result: String
)
