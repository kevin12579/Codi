# Codi Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub PR Webhook 수신 → Redis Stream → Claude AI 코드리뷰 → Slack 알림 → PostgreSQL 파이프라인 이력 저장/조회 API까지 Codi 백엔드 전체를 구현한다.

**Architecture:** DDD 4-레이어 (Presentation → Application → Domain → Infrastructure). WebFlux + Kotlin Coroutines 비동기. JPA는 `withContext(Dispatchers.IO)`로 블로킹 격리. Redis Stream Consumer Group으로 정확히 1회 이벤트 처리.

**Tech Stack:** Kotlin 1.9, Spring Boot 3.2.5 WebFlux, PostgreSQL 15 (JPA + Flyway), Redis 7 Reactive, Claude API (claude-sonnet-4-20250514), GitHub REST API v3, Slack Incoming Webhook

---

## Task 1: Bootstrap — CodeAiApplication + Config + Common Layer

**Files:**
- Modify: `src/main/kotlin/com/codeai/CodeAiApplication.kt`
- Modify: `src/main/resources/application.yml`
- Create: `src/main/resources/application-local.yml`
- Create: `src/main/kotlin/com/codeai/presentation/common/ApiResponse.kt`
- Create: `src/main/kotlin/com/codeai/presentation/common/GlobalExceptionHandler.kt`

- [ ] **Step 1: Write CodeAiApplication.kt**

```kotlin
package com.codeai

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class CodeAiApplication

fun main(args: Array<String>) {
    runApplication<CodeAiApplication>(*args)
}
```

- [ ] **Step 2: Update application.yml (datasource + jpa 추가)**

```yaml
spring:
  application:
    name: codeai-backend

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:codeai}
    username: ${DB_USER:codeai}
    password: ${DB_PASSWORD:codeai1234}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: false
        dialect: org.hibernate.dialect.PostgreSQLDialect

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

  flyway:
    enabled: true
    locations: classpath:db/migration

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true

codeai:
  webhook:
    secret: ${WEBHOOK_SECRET:default-secret}
  api:
    key: ${CODEAI_API_KEY:codeai-local-key}

claude:
  api:
    key: ${CLAUDE_API_KEY:placeholder}
    max-tokens: ${CLAUDE_MAX_TOKENS:3000}

slack:
  webhook:
    url: ${SLACK_WEBHOOK_URL:placeholder}

github:
  token: ${GITHUB_TOKEN:placeholder}
```

- [ ] **Step 3: Create application-local.yml**

```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true

logging:
  level:
    com.codeai: DEBUG
    org.springframework.web.reactive: DEBUG
```

- [ ] **Step 4: Write ApiResponse.kt**

```kotlin
package com.codeai.presentation.common

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val error: ApiError? = null
) {
    companion object {
        fun <T> ok(data: T, message: String = "OK") =
            ApiResponse(success = true, data = data, message = message)

        fun ok(message: String = "OK") =
            ApiResponse<Nothing>(success = true, message = message)

        fun fail(code: String, message: String) =
            ApiResponse<Nothing>(success = false, error = ApiError(code, message))
    }
}

data class ApiError(val code: String, val message: String)
```

- [ ] **Step 5: Write GlobalExceptionHandler.kt**

```kotlin
package com.codeai.presentation.common

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleIllegalArgument(e: IllegalArgumentException): ApiResponse<Nothing> =
        ApiResponse.fail("INVALID_PARAMETERS", e.message ?: "잘못된 요청입니다.")

    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(e: NoSuchElementException): ApiResponse<Nothing> =
        ApiResponse.fail("RESOURCE_NOT_FOUND", e.message ?: "리소스를 찾을 수 없습니다.")

    @ExceptionHandler(Exception::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun handleException(e: Exception): ApiResponse<Nothing> {
        e.printStackTrace()
        return ApiResponse.fail("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다.")
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/CodeAiApplication.kt \
        codeai-backend/src/main/resources/application.yml \
        codeai-backend/src/main/resources/application-local.yml \
        codeai-backend/src/main/kotlin/com/codeai/presentation/common/
git commit -m "feat: bootstrap - CodeAiApplication + common layer (ApiResponse, GlobalExceptionHandler)"
```

---

## Task 2: DB Schema (Flyway Migration)

**Files:**
- Create: `src/main/resources/db/migration/V1__init_schema.sql`
- Create: `src/main/resources/db/migration/V2__add_indexes.sql`

- [ ] **Step 1: Write V1__init_schema.sql**

```sql
-- =============================================
-- 코디(Code AI) Database Schema — PostgreSQL 15
-- =============================================

CREATE TABLE repositories (
    id              BIGSERIAL PRIMARY KEY,
    github_repo_id  BIGINT        NOT NULL UNIQUE,
    owner           VARCHAR(100)  NOT NULL,
    name            VARCHAR(200)  NOT NULL,
    full_name       VARCHAR(300)  NOT NULL UNIQUE,
    webhook_secret  VARCHAR(500)  NOT NULL,
    webhook_id      BIGINT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_executions (
    id              BIGSERIAL PRIMARY KEY,
    repository_id   BIGINT        NOT NULL REFERENCES repositories(id),
    pr_number       INT           NOT NULL,
    pr_title        VARCHAR(500)  NOT NULL,
    pr_url          VARCHAR(1000) NOT NULL,
    pr_author       VARCHAR(100)  NOT NULL,
    head_sha        VARCHAR(40)   NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_steps (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT       NOT NULL REFERENCES pipeline_executions(id),
    step_type               VARCHAR(50)  NOT NULL
                            CHECK (step_type IN ('WEBHOOK','REVIEW','TEST','NOTIFY','DEPLOY')),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED','SKIPPED')),
    started_at              TIMESTAMP,
    completed_at            TIMESTAMP,
    error_message           TEXT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE code_reviews (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT       NOT NULL UNIQUE REFERENCES pipeline_executions(id),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','COMPLETED','FAILED')),
    prompt_version          VARCHAR(10)  NOT NULL DEFAULT 'v3',
    total_issues            INT          NOT NULL DEFAULT 0,
    high_count              INT          NOT NULL DEFAULT 0,
    medium_count            INT          NOT NULL DEFAULT 0,
    low_count               INT          NOT NULL DEFAULT 0,
    tokens_used             INT,
    github_comment_id       BIGINT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMP
);

CREATE TABLE review_comments (
    id              BIGSERIAL PRIMARY KEY,
    code_review_id  BIGINT        NOT NULL REFERENCES code_reviews(id),
    severity        VARCHAR(10)   NOT NULL
                    CHECK (severity IN ('HIGH','MEDIUM','LOW')),
    file_path       VARCHAR(500)  NOT NULL,
    line_number     INT,
    content         TEXT          NOT NULL,
    suggestion      TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE test_runs (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT         NOT NULL UNIQUE REFERENCES pipeline_executions(id),
    status                  VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','RUNNING','PASSED','FAILED')),
    total_tests             INT            NOT NULL DEFAULT 0,
    passed                  INT            NOT NULL DEFAULT 0,
    failed                  INT            NOT NULL DEFAULT 0,
    coverage_pct            DECIMAL(5,2),
    started_at              TIMESTAMP,
    completed_at            TIMESTAMP,
    created_at              TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE test_cases (
    id              BIGSERIAL PRIMARY KEY,
    test_run_id     BIGINT        NOT NULL REFERENCES test_runs(id),
    test_name       VARCHAR(500)  NOT NULL,
    status          VARCHAR(10)   NOT NULL
                    CHECK (status IN ('PASSED','FAILED','SKIPPED')),
    duration_ms     INT,
    error_message   TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_messages (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT       NOT NULL REFERENCES pipeline_executions(id),
    channel                 VARCHAR(20)  NOT NULL
                            CHECK (channel IN ('SLACK','GITHUB')),
    message                 TEXT         NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','SENT','FAILED')),
    sent_at                 TIMESTAMP,
    error_message           TEXT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Write V2__add_indexes.sql**

```sql
CREATE INDEX idx_pipeline_repo_id    ON pipeline_executions(repository_id);
CREATE INDEX idx_pipeline_status     ON pipeline_executions(status);
CREATE INDEX idx_pipeline_created_at ON pipeline_executions(created_at DESC);
CREATE INDEX idx_steps_pipeline_id   ON pipeline_steps(pipeline_execution_id);
CREATE INDEX idx_reviews_pipeline_id ON code_reviews(pipeline_execution_id);
CREATE INDEX idx_review_comments_review_id ON review_comments(code_review_id);
CREATE INDEX idx_review_comments_severity  ON review_comments(severity);
CREATE INDEX idx_test_runs_pipeline_id     ON test_runs(pipeline_execution_id);
CREATE INDEX idx_test_cases_run_id         ON test_cases(test_run_id);
CREATE INDEX idx_notifications_pipeline_id ON notification_messages(pipeline_execution_id);
```

- [ ] **Step 3: Commit**

```bash
git add codeai-backend/src/main/resources/db/
git commit -m "feat: DB schema - 8 tables + indexes (Flyway V1, V2)"
```

---

## Task 3: Infrastructure Config (Redis, JPA, WebFlux, Security)

**Files:**
- Create: `infrastructure/config/RedisConfig.kt`
- Create: `infrastructure/config/JpaConfig.kt`
- Create: `infrastructure/config/WebFluxConfig.kt`
- Create: `infrastructure/config/SecurityConfig.kt`

- [ ] **Step 1: Write RedisConfig.kt**

```kotlin
package com.codeai.infrastructure.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory
import org.springframework.data.redis.core.ReactiveRedisTemplate
import org.springframework.data.redis.serializer.RedisSerializationContext
import org.springframework.data.redis.serializer.StringRedisSerializer

@Configuration
class RedisConfig {

    @Bean
    fun reactiveRedisTemplate(
        factory: ReactiveRedisConnectionFactory
    ): ReactiveRedisTemplate<String, String> {
        val context = RedisSerializationContext
            .newSerializationContext<String, String>(StringRedisSerializer())
            .build()
        return ReactiveRedisTemplate(factory, context)
    }
}
```

- [ ] **Step 2: Write JpaConfig.kt**

```kotlin
package com.codeai.infrastructure.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.transaction.annotation.EnableTransactionManagement

@Configuration
@EnableJpaRepositories(basePackages = ["com.codeai.infrastructure.persistence"])
@EnableTransactionManagement
class JpaConfig
```

- [ ] **Step 3: Write WebFluxConfig.kt**

```kotlin
package com.codeai.infrastructure.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.config.EnableWebFlux
import org.springframework.web.reactive.config.WebFluxConfigurer

@Configuration
@EnableWebFlux
class WebFluxConfig : WebFluxConfigurer
```

- [ ] **Step 4: Write SecurityConfig.kt (모든 요청 허용 — MVP)**

```kotlin
package com.codeai.infrastructure.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.web.server.SecurityWebFilterChain

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

    @Bean
    fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain =
        http
            .csrf { it.disable() }
            .authorizeExchange { auth -> auth.anyExchange().permitAll() }
            .build()
}
```

> **주의:** `spring-boot-starter-security` 의존성을 `build.gradle.kts`에 추가해야 한다.

- [ ] **Step 5: build.gradle.kts에 security 의존성 추가**

`dependencies { }` 블록에 아래 줄 추가:
```kotlin
implementation("org.springframework.boot:spring-boot-starter-security")
```

- [ ] **Step 6: Commit**

```bash
git add codeai-backend/build.gradle.kts \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/config/
git commit -m "feat: infrastructure config - Redis, JPA, WebFlux, Security"
```

---

## Task 4: Domain Events

**Files:**
- Create: `domain/event/DomainEvent.kt`
- Create: `domain/event/ReviewCompleted.kt`
- Create: `domain/event/TestRunCompleted.kt`
- Create: `domain/event/PipelineStarted.kt`
- Create: `domain/event/PipelineCompleted.kt`

- [ ] **Step 1: Write DomainEvent.kt**

```kotlin
package com.codeai.domain.event

import java.time.LocalDateTime

interface DomainEvent {
    val occurredAt: LocalDateTime
}
```

- [ ] **Step 2: Write ReviewCompleted.kt**

```kotlin
package com.codeai.domain.event

import java.time.LocalDateTime

data class ReviewCompleted(
    val pipelineExecutionId: Long,
    val codeReviewId: Long,
    val highCount: Int,
    val mediumCount: Int,
    val lowCount: Int,
    val prUrl: String,
    val prTitle: String,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
```

- [ ] **Step 3: Write TestRunCompleted.kt**

```kotlin
package com.codeai.domain.event

import java.time.LocalDateTime

data class TestRunCompleted(
    val pipelineExecutionId: Long,
    val testRunId: Long,
    val passed: Boolean,
    val totalTests: Int,
    val failedCount: Int,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
```

- [ ] **Step 4: Write PipelineStarted.kt + PipelineCompleted.kt**

```kotlin
package com.codeai.domain.event

import java.time.LocalDateTime

data class PipelineStarted(
    val pipelineExecutionId: Long,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent

data class PipelineCompleted(
    val pipelineExecutionId: Long,
    val success: Boolean,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : DomainEvent
```

- [ ] **Step 5: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/domain/event/
git commit -m "feat: domain events - ReviewCompleted, TestRunCompleted, PipelineStarted/Completed"
```

---

## Task 5: Pipeline Domain + Persistence

**Files:**
- Create: `domain/pipeline/PipelineStatus.kt`
- Create: `domain/pipeline/StepType.kt`
- Create: `domain/pipeline/PipelineExecution.kt`
- Create: `domain/pipeline/PipelineRepository.kt`
- Create: `infrastructure/persistence/pipeline/PipelineExecutionEntity.kt`
- Create: `infrastructure/persistence/pipeline/PipelineExecutionJpaRepository.kt`
- Create: `infrastructure/persistence/pipeline/PipelineRepositoryImpl.kt`

- [ ] **Step 1: Write PipelineStatus.kt + StepType.kt**

```kotlin
// PipelineStatus.kt
package com.codeai.domain.pipeline

enum class PipelineStatus { PENDING, RUNNING, SUCCESS, FAILED }

// StepType.kt
package com.codeai.domain.pipeline

enum class StepType { WEBHOOK, REVIEW, TEST, NOTIFY, DEPLOY }

enum class StepStatus { PENDING, RUNNING, SUCCESS, FAILED, SKIPPED }
```

- [ ] **Step 2: Write PipelineExecution.kt**

```kotlin
package com.codeai.domain.pipeline

import java.time.LocalDateTime

data class PipelineExecution(
    val id: Long = 0,
    val repositoryId: Long,
    val prNumber: Int,
    val prTitle: String,
    val prUrl: String,
    val prAuthor: String,
    val headSha: String,
    val status: PipelineStatus = PipelineStatus.PENDING,
    val startedAt: LocalDateTime? = null,
    val completedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun start() = copy(status = PipelineStatus.RUNNING, startedAt = LocalDateTime.now())
    fun complete() = copy(status = PipelineStatus.SUCCESS, completedAt = LocalDateTime.now())
    fun fail() = copy(status = PipelineStatus.FAILED, completedAt = LocalDateTime.now())

    val durationSeconds: Long?
        get() = if (startedAt != null && completedAt != null)
            java.time.Duration.between(startedAt, completedAt).seconds
        else null
}
```

- [ ] **Step 3: Write PipelineRepository.kt**

```kotlin
package com.codeai.domain.pipeline

interface PipelineRepository {
    suspend fun save(execution: PipelineExecution): PipelineExecution
    suspend fun findById(id: Long): PipelineExecution?
    suspend fun findAll(
        status: String?,
        from: String?,
        to: String?,
        page: Int,
        size: Int
    ): PipelineExecutionPage
    suspend fun countByStatus(status: PipelineStatus): Long
    suspend fun findRecent(limit: Int): List<PipelineExecution>
}

data class PipelineExecutionPage(
    val content: List<PipelineExecution>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)
```

- [ ] **Step 4: Write PipelineExecutionEntity.kt**

```kotlin
package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.pipeline.PipelineStatus
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "pipeline_executions")
class PipelineExecutionEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "repository_id", nullable = false)
    val repositoryId: Long,

    @Column(name = "pr_number", nullable = false)
    val prNumber: Int,

    @Column(name = "pr_title", nullable = false)
    val prTitle: String,

    @Column(name = "pr_url", nullable = false)
    val prUrl: String,

    @Column(name = "pr_author", nullable = false)
    val prAuthor: String,

    @Column(name = "head_sha", nullable = false)
    val headSha: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PipelineStatus = PipelineStatus.PENDING,

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null,

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = PipelineExecution(
        id = id, repositoryId = repositoryId, prNumber = prNumber,
        prTitle = prTitle, prUrl = prUrl, prAuthor = prAuthor,
        headSha = headSha, status = status,
        startedAt = startedAt, completedAt = completedAt, createdAt = createdAt
    )

    companion object {
        fun from(d: PipelineExecution) = PipelineExecutionEntity(
            id = d.id, repositoryId = d.repositoryId, prNumber = d.prNumber,
            prTitle = d.prTitle, prUrl = d.prUrl, prAuthor = d.prAuthor,
            headSha = d.headSha, status = d.status,
            startedAt = d.startedAt, completedAt = d.completedAt, createdAt = d.createdAt
        )
    }
}
```

- [ ] **Step 5: Write PipelineExecutionJpaRepository.kt**

```kotlin
package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.PipelineStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PipelineExecutionJpaRepository : JpaRepository<PipelineExecutionEntity, Long> {

    @Query("""
        SELECT p FROM PipelineExecutionEntity p
        WHERE (:status IS NULL OR p.status = :status)
          AND (:from IS NULL OR p.createdAt >= :from)
          AND (:to IS NULL OR p.createdAt <= :to)
        ORDER BY p.createdAt DESC
    """)
    fun findFiltered(
        @Param("status") status: PipelineStatus?,
        @Param("from") from: LocalDateTime?,
        @Param("to") to: LocalDateTime?,
        pageable: Pageable
    ): Page<PipelineExecutionEntity>

    fun countByStatus(status: PipelineStatus): Long

    fun findTop10ByOrderByCreatedAtDesc(): List<PipelineExecutionEntity>

    @Query("""
        SELECT p FROM PipelineExecutionEntity p
        WHERE p.createdAt >= :from
        ORDER BY p.createdAt ASC
    """)
    fun findSince(@Param("from") from: LocalDateTime): List<PipelineExecutionEntity>
}
```

- [ ] **Step 6: Write PipelineRepositoryImpl.kt**

```kotlin
package com.codeai.infrastructure.persistence.pipeline

import com.codeai.domain.pipeline.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Repository
class PipelineRepositoryImpl(
    private val jpa: PipelineExecutionJpaRepository
) : PipelineRepository {

    override suspend fun save(execution: PipelineExecution): PipelineExecution =
        withContext(Dispatchers.IO) {
            jpa.save(PipelineExecutionEntity.from(execution)).toDomain()
        }

    override suspend fun findById(id: Long): PipelineExecution? =
        withContext(Dispatchers.IO) {
            jpa.findById(id).orElse(null)?.toDomain()
        }

    override suspend fun findAll(
        status: String?, from: String?, to: String?, page: Int, size: Int
    ): PipelineExecutionPage = withContext(Dispatchers.IO) {
        val fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val statusEnum = status?.let { PipelineStatus.valueOf(it) }
        val fromDt = from?.let { LocalDate.parse(it, fmt).atStartOfDay() }
        val toDt = to?.let { LocalDate.parse(it, fmt).atTime(23, 59, 59) }
        val result = jpa.findFiltered(statusEnum, fromDt, toDt, PageRequest.of(page, size))
        PipelineExecutionPage(
            content = result.content.map { it.toDomain() },
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            currentPage = page
        )
    }

    override suspend fun countByStatus(status: PipelineStatus): Long =
        withContext(Dispatchers.IO) { jpa.countByStatus(status) }

    override suspend fun findRecent(limit: Int): List<PipelineExecution> =
        withContext(Dispatchers.IO) {
            jpa.findTop10ByOrderByCreatedAtDesc().map { it.toDomain() }
        }
}
```

- [ ] **Step 7: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/domain/pipeline/ \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/pipeline/
git commit -m "feat: pipeline domain + JPA persistence"
```

---

## Task 6: Repository Domain + Persistence (GitHub 레포 관리)

**Files:**
- Create: `domain/repository/Repository.kt`
- Create: `domain/repository/RepositoryRepository.kt`
- Create: `infrastructure/persistence/repository/RepositoryEntity.kt`
- Create: `infrastructure/persistence/repository/RepositoryJpaRepository.kt`
- Create: `infrastructure/persistence/repository/RepositoryRepositoryImpl.kt`

- [ ] **Step 1: Write Repository.kt + RepositoryRepository.kt**

```kotlin
// Repository.kt
package com.codeai.domain.repository

import java.time.LocalDateTime

data class Repository(
    val id: Long = 0,
    val githubRepoId: Long,
    val owner: String,
    val name: String,
    val fullName: String,
    val webhookSecret: String,
    val isActive: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

// RepositoryRepository.kt
package com.codeai.domain.repository

interface RepositoryRepository {
    suspend fun findByGithubRepoId(githubRepoId: Long): Repository?
    suspend fun findByFullName(fullName: String): Repository?
    suspend fun save(repo: Repository): Repository
}
```

- [ ] **Step 2: Write RepositoryEntity.kt**

```kotlin
package com.codeai.infrastructure.persistence.repository

import com.codeai.domain.repository.Repository
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "repositories")
class RepositoryEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "github_repo_id", nullable = false, unique = true)
    val githubRepoId: Long,

    @Column(nullable = false)
    val owner: String,

    @Column(nullable = false)
    val name: String,

    @Column(name = "full_name", nullable = false, unique = true)
    val fullName: String,

    @Column(name = "webhook_secret", nullable = false)
    val webhookSecret: String,

    @Column(name = "is_active", nullable = false)
    val isActive: Boolean = true,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = Repository(
        id = id, githubRepoId = githubRepoId, owner = owner,
        name = name, fullName = fullName, webhookSecret = webhookSecret,
        isActive = isActive, createdAt = createdAt
    )

    companion object {
        fun from(d: Repository) = RepositoryEntity(
            id = d.id, githubRepoId = d.githubRepoId, owner = d.owner,
            name = d.name, fullName = d.fullName, webhookSecret = d.webhookSecret,
            isActive = d.isActive, createdAt = d.createdAt
        )
    }
}
```

- [ ] **Step 3: Write RepositoryJpaRepository.kt + RepositoryRepositoryImpl.kt**

```kotlin
// RepositoryJpaRepository.kt
package com.codeai.infrastructure.persistence.repository

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface RepositoryJpaRepository : JpaRepository<RepositoryEntity, Long> {
    fun findByGithubRepoId(githubRepoId: Long): Optional<RepositoryEntity>
    fun findByFullName(fullName: String): Optional<RepositoryEntity>
}

// RepositoryRepositoryImpl.kt
package com.codeai.infrastructure.persistence.repository

import com.codeai.domain.repository.Repository
import com.codeai.domain.repository.RepositoryRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository as SpringRepository

@SpringRepository
class RepositoryRepositoryImpl(
    private val jpa: RepositoryJpaRepository
) : RepositoryRepository {

    override suspend fun findByGithubRepoId(githubRepoId: Long): Repository? =
        withContext(Dispatchers.IO) {
            jpa.findByGithubRepoId(githubRepoId).orElse(null)?.toDomain()
        }

    override suspend fun findByFullName(fullName: String): Repository? =
        withContext(Dispatchers.IO) {
            jpa.findByFullName(fullName).orElse(null)?.toDomain()
        }

    override suspend fun save(repo: Repository): Repository =
        withContext(Dispatchers.IO) {
            jpa.save(RepositoryEntity.from(repo)).toDomain()
        }
}
```

- [ ] **Step 4: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/domain/repository/ \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/repository/
git commit -m "feat: repository domain + JPA persistence (GitHub repo management)"
```

---

## Task 7: Webhook Reception — HMAC + Controller + UseCase

**Files:**
- Create: `presentation/webhook/WebhookRequest.kt`
- Create: `presentation/webhook/HmacValidator.kt`
- Create: `presentation/webhook/WebhookController.kt`
- Create: `infrastructure/queue/RedisStreamProducer.kt`
- Create: `infrastructure/queue/RedisStreamConfig.kt`
- Create: `application/webhook/WebhookProcessUseCase.kt`
- Test: `src/test/kotlin/com/codeai/presentation/webhook/HmacValidatorTest.kt`

- [ ] **Step 1: Write HmacValidatorTest.kt (failing)**

```kotlin
package com.codeai.presentation.webhook

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class HmacValidatorTest {

    private val secret = "test-secret"
    private val validator = HmacValidator(secret)

    @Test
    fun `유효한 HMAC 서명이면 true 반환`() {
        val payload = """{"action":"opened"}"""
        val mac = javax.crypto.Mac.getInstance("HmacSHA256")
        val key = javax.crypto.spec.SecretKeySpec(secret.toByteArray(), "HmacSHA256")
        mac.init(key)
        val sig = "sha256=" + mac.doFinal(payload.toByteArray()).joinToString("") { "%02x".format(it) }

        assertTrue(validator.validate(payload, sig))
    }

    @Test
    fun `잘못된 서명이면 false 반환`() {
        assertFalse(validator.validate("""{"action":"opened"}""", "sha256=invalidsig"))
    }

    @Test
    fun `빈 서명이면 false 반환`() {
        assertFalse(validator.validate("payload", ""))
    }
}
```

- [ ] **Step 2: Run test — 실패 확인**

```bash
cd codeai-backend
./gradlew test --tests "com.codeai.presentation.webhook.HmacValidatorTest" 2>&1 | tail -20
```

Expected: `HmacValidator` 클래스 없어서 컴파일 에러

- [ ] **Step 3: Write HmacValidator.kt**

```kotlin
package com.codeai.presentation.webhook

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Component
class HmacValidator(
    @Value("\${codeai.webhook.secret}") private val secret: String
) {
    constructor(secret: String) : this(secret)  // 테스트용 생성자

    fun validate(payload: String, signature: String): Boolean {
        if (signature.isBlank()) return false
        return try {
            val mac = Mac.getInstance("HmacSHA256")
            val key = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
            mac.init(key)
            val calculated = "sha256=" + mac.doFinal(payload.toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it) }
            calculated == signature
        } catch (e: Exception) {
            false
        }
    }
}
```

- [ ] **Step 4: Run test — 통과 확인**

```bash
./gradlew test --tests "com.codeai.presentation.webhook.HmacValidatorTest"
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Write WebhookRequest.kt**

```kotlin
package com.codeai.presentation.webhook

import com.fasterxml.jackson.annotation.JsonProperty

data class WebhookPayload(
    val action: String = "",
    @JsonProperty("pull_request") val pullRequest: PullRequestPayload? = null,
    val repository: RepositoryPayload? = null
)

data class PullRequestPayload(
    val number: Int = 0,
    val title: String = "",
    @JsonProperty("html_url") val htmlUrl: String = "",
    val head: HeadPayload = HeadPayload(),
    val user: UserPayload = UserPayload()
)

data class HeadPayload(val sha: String = "")
data class UserPayload(val login: String = "")

data class RepositoryPayload(
    val id: Long = 0,
    @JsonProperty("full_name") val fullName: String = "",
    val name: String = "",
    val owner: OwnerPayload = OwnerPayload()
)

data class OwnerPayload(val login: String = "")
```

- [ ] **Step 6: Write RedisStreamConfig.kt**

```kotlin
package com.codeai.infrastructure.queue

import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory
import org.springframework.data.redis.connection.stream.Consumer
import org.springframework.data.redis.connection.stream.ReadOffset
import org.springframework.data.redis.connection.stream.StreamOffset
import org.springframework.data.redis.core.ReactiveRedisTemplate

@Configuration
class RedisStreamConfig(
    private val redisTemplate: ReactiveRedisTemplate<String, String>
) {
    companion object {
        const val STREAM_KEY = "codeai:webhook:events"
        const val GROUP_NAME = "pipeline-workers"
        const val CONSUMER_NAME = "worker-1"
    }

    fun ensureConsumerGroup() {
        try {
            redisTemplate.opsForStream<String, String>()
                .createGroup(STREAM_KEY, ReadOffset.from("0"), GROUP_NAME)
                .subscribe()
        } catch (e: Exception) {
            // 이미 그룹이 존재하면 무시
        }
    }
}
```

- [ ] **Step 7: Write RedisStreamProducer.kt**

```kotlin
package com.codeai.infrastructure.queue

import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.core.ReactiveRedisTemplate
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class RedisStreamProducer(
    private val redisTemplate: ReactiveRedisTemplate<String, String>
) {
    fun publish(eventData: Map<String, String>): Mono<String> {
        val record = MapRecord.create(RedisStreamConfig.STREAM_KEY, eventData)
        return redisTemplate.opsForStream<String, String>()
            .add(record)
            .map { it.value }
    }
}
```

- [ ] **Step 8: Write WebhookProcessUseCase.kt**

```kotlin
package com.codeai.application.webhook

import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.repository.Repository
import com.codeai.domain.repository.RepositoryRepository
import com.codeai.infrastructure.queue.RedisStreamProducer
import com.codeai.presentation.webhook.WebhookPayload
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class WebhookProcessUseCase(
    private val pipelineRepository: PipelineRepository,
    private val repositoryRepository: RepositoryRepository,
    private val streamProducer: RedisStreamProducer,
    private val objectMapper: ObjectMapper,
    @Value("\${codeai.webhook.secret}") private val webhookSecret: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun process(rawPayload: String): Long {
        val payload = objectMapper.readValue(rawPayload, WebhookPayload::class.java)
        val pr = payload.pullRequest ?: throw IllegalArgumentException("pull_request 없음")
        val repoPayload = payload.repository ?: throw IllegalArgumentException("repository 없음")

        // 레포지토리 조회 or 생성
        val repo = repositoryRepository.findByGithubRepoId(repoPayload.id)
            ?: repositoryRepository.save(
                Repository(
                    githubRepoId = repoPayload.id,
                    owner = repoPayload.owner.login,
                    name = repoPayload.name,
                    fullName = repoPayload.fullName,
                    webhookSecret = webhookSecret
                )
            )

        // PipelineExecution 생성
        val execution = pipelineRepository.save(
            PipelineExecution(
                repositoryId = repo.id,
                prNumber = pr.number,
                prTitle = pr.title,
                prUrl = pr.htmlUrl,
                prAuthor = pr.user.login,
                headSha = pr.head.sha
            )
        )

        // Redis Stream에 이벤트 적재
        val eventData = mapOf(
            "pipelineExecutionId" to execution.id.toString(),
            "prNumber" to pr.number.toString(),
            "repoFullName" to repo.fullName,
            "headSha" to pr.head.sha,
            "prUrl" to pr.htmlUrl,
            "prTitle" to pr.title
        )
        streamProducer.publish(eventData).awaitSingle()

        log.info("Pipeline execution 생성: id=${execution.id}, PR#${pr.number}")
        return execution.id
    }
}
```

- [ ] **Step 9: Write WebhookController.kt**

```kotlin
package com.codeai.presentation.webhook

import com.codeai.application.webhook.WebhookProcessUseCase
import com.codeai.presentation.common.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/webhook")
class WebhookController(
    private val hmacValidator: HmacValidator,
    private val webhookProcessUseCase: WebhookProcessUseCase
) {
    @PostMapping("/github")
    suspend fun receiveGithubWebhook(
        @RequestHeader("X-Hub-Signature-256", required = false) signature: String?,
        @RequestHeader("X-GitHub-Event", required = false) eventType: String?,
        @RequestBody payload: String
    ): ResponseEntity<ApiResponse<Map<String, Any>>> {
        if (signature == null || !hmacValidator.validate(payload, signature)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.fail("WEBHOOK_SIGNATURE_INVALID", "서명 검증 실패"))
        }

        if (eventType != "pull_request") {
            return ResponseEntity.ok(
                ApiResponse.ok(mapOf<String, Any>("message" to "ignored"), "지원하지 않는 이벤트")
            )
        }

        val executionId = webhookProcessUseCase.process(payload)
        return ResponseEntity.ok(
            ApiResponse.ok(mapOf<String, Any>("pipelineExecutionId" to executionId), "이벤트 수신 완료")
        )
    }
}
```

- [ ] **Step 10: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/presentation/webhook/ \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/queue/ \
        codeai-backend/src/main/kotlin/com/codeai/application/webhook/ \
        codeai-backend/src/test/kotlin/com/codeai/presentation/webhook/
git commit -m "feat: webhook reception - HMAC validation + Redis Stream producer + WebhookProcessUseCase"
```

---

## Task 8: Redis Stream Consumer (Pipeline Worker)

**Files:**
- Create: `infrastructure/queue/RedisStreamConsumer.kt`

- [ ] **Step 1: Write RedisStreamConsumer.kt**

```kotlin
package com.codeai.infrastructure.queue

import com.codeai.application.review.ReviewUseCase
import jakarta.annotation.PostConstruct
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import org.springframework.data.redis.connection.stream.Consumer
import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.connection.stream.ReadOffset
import org.springframework.data.redis.connection.stream.StreamOffset
import org.springframework.data.redis.core.ReactiveRedisTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class RedisStreamConsumer(
    private val redisTemplate: ReactiveRedisTemplate<String, String>,
    private val streamConfig: RedisStreamConfig,
    private val reviewUseCase: ReviewUseCase
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val scope = CoroutineScope(Dispatchers.IO)

    @PostConstruct
    fun init() {
        streamConfig.ensureConsumerGroup()
    }

    @Scheduled(fixedDelay = 1000)
    fun consume() {
        redisTemplate.opsForStream<String, String>()
            .read(
                Consumer.from(RedisStreamConfig.GROUP_NAME, RedisStreamConfig.CONSUMER_NAME),
                StreamOffset.create(RedisStreamConfig.STREAM_KEY, ReadOffset.lastConsumed())
            )
            .subscribe { record ->
                val data = record.value
                val pipelineExecutionId = data["pipelineExecutionId"]?.toLong() ?: return@subscribe

                scope.launch {
                    try {
                        log.info("Pipeline 처리 시작: executionId=$pipelineExecutionId")
                        reviewUseCase.execute(
                            pipelineExecutionId = pipelineExecutionId,
                            repoFullName = data["repoFullName"] ?: "",
                            prNumber = data["prNumber"]?.toInt() ?: 0,
                            headSha = data["headSha"] ?: "",
                            prUrl = data["prUrl"] ?: "",
                            prTitle = data["prTitle"] ?: ""
                        )
                        ackMessage(record)
                    } catch (e: Exception) {
                        log.error("Pipeline 처리 실패: executionId=$pipelineExecutionId", e)
                    }
                }
            }
    }

    private fun ackMessage(record: MapRecord<String, String, String>) {
        redisTemplate.opsForStream<String, String>()
            .acknowledge(RedisStreamConfig.GROUP_NAME, record)
            .subscribe()
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/queue/RedisStreamConsumer.kt
git commit -m "feat: Redis Stream Consumer - pipeline worker with coroutine dispatch"
```

---

## Task 9: Review Domain + Persistence

**Files:**
- Create: `domain/review/ReviewSeverity.kt`
- Create: `domain/review/ReviewStatus.kt`
- Create: `domain/review/ReviewComment.kt`
- Create: `domain/review/CodeReview.kt`
- Create: `domain/review/CodeReviewRepository.kt`
- Create: `infrastructure/persistence/review/CodeReviewEntity.kt`
- Create: `infrastructure/persistence/review/ReviewCommentEntity.kt`
- Create: `infrastructure/persistence/review/CodeReviewJpaRepository.kt`
- Create: `infrastructure/persistence/review/CodeReviewRepositoryImpl.kt`

- [ ] **Step 1: Write ReviewSeverity.kt + ReviewStatus.kt**

```kotlin
// ReviewSeverity.kt
package com.codeai.domain.review

enum class ReviewSeverity { HIGH, MEDIUM, LOW }

// ReviewStatus.kt
package com.codeai.domain.review

enum class ReviewStatus { PENDING, COMPLETED, FAILED }
```

- [ ] **Step 2: Write ReviewComment.kt**

```kotlin
package com.codeai.domain.review

import java.time.LocalDateTime

data class ReviewComment(
    val id: Long = 0,
    val codeReviewId: Long = 0,
    val severity: ReviewSeverity,
    val filePath: String,
    val lineNumber: Int? = null,
    val content: String,
    val suggestion: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
```

- [ ] **Step 3: Write CodeReview.kt**

```kotlin
package com.codeai.domain.review

import java.time.LocalDateTime

data class CodeReview(
    val id: Long = 0,
    val pipelineExecutionId: Long,
    val status: ReviewStatus = ReviewStatus.PENDING,
    val promptVersion: String = "v3",
    val totalIssues: Int = 0,
    val highCount: Int = 0,
    val mediumCount: Int = 0,
    val lowCount: Int = 0,
    val tokensUsed: Int? = null,
    val githubCommentId: Long? = null,
    val comments: List<ReviewComment> = emptyList(),
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val completedAt: LocalDateTime? = null
) {
    fun complete(comments: List<ReviewComment>, tokensUsed: Int, githubCommentId: Long?) = copy(
        status = ReviewStatus.COMPLETED,
        comments = comments,
        totalIssues = comments.size,
        highCount = comments.count { it.severity == ReviewSeverity.HIGH },
        mediumCount = comments.count { it.severity == ReviewSeverity.MEDIUM },
        lowCount = comments.count { it.severity == ReviewSeverity.LOW },
        tokensUsed = tokensUsed,
        githubCommentId = githubCommentId,
        completedAt = LocalDateTime.now()
    )

    fun fail() = copy(status = ReviewStatus.FAILED, completedAt = LocalDateTime.now())
}
```

- [ ] **Step 4: Write CodeReviewRepository.kt**

```kotlin
package com.codeai.domain.review

interface CodeReviewRepository {
    suspend fun save(review: CodeReview): CodeReview
    suspend fun saveComment(comment: ReviewComment): ReviewComment
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): CodeReview?
    suspend fun findCommentsByReviewId(reviewId: Long): List<ReviewComment>
}
```

- [ ] **Step 5: Write CodeReviewEntity.kt + ReviewCommentEntity.kt**

```kotlin
// CodeReviewEntity.kt
package com.codeai.infrastructure.persistence.review

import com.codeai.domain.review.CodeReview
import com.codeai.domain.review.ReviewStatus
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "code_reviews")
class CodeReviewEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "pipeline_execution_id", nullable = false, unique = true)
    val pipelineExecutionId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ReviewStatus = ReviewStatus.PENDING,

    @Column(name = "prompt_version", nullable = false)
    var promptVersion: String = "v3",

    @Column(name = "total_issues", nullable = false)
    var totalIssues: Int = 0,

    @Column(name = "high_count", nullable = false)
    var highCount: Int = 0,

    @Column(name = "medium_count", nullable = false)
    var mediumCount: Int = 0,

    @Column(name = "low_count", nullable = false)
    var lowCount: Int = 0,

    @Column(name = "tokens_used")
    var tokensUsed: Int? = null,

    @Column(name = "github_comment_id")
    var githubCommentId: Long? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null
) {
    fun toDomain() = CodeReview(
        id = id, pipelineExecutionId = pipelineExecutionId,
        status = status, promptVersion = promptVersion,
        totalIssues = totalIssues, highCount = highCount,
        mediumCount = mediumCount, lowCount = lowCount,
        tokensUsed = tokensUsed, githubCommentId = githubCommentId,
        createdAt = createdAt, completedAt = completedAt
    )

    companion object {
        fun from(d: CodeReview) = CodeReviewEntity(
            id = d.id, pipelineExecutionId = d.pipelineExecutionId,
            status = d.status, promptVersion = d.promptVersion,
            totalIssues = d.totalIssues, highCount = d.highCount,
            mediumCount = d.mediumCount, lowCount = d.lowCount,
            tokensUsed = d.tokensUsed, githubCommentId = d.githubCommentId,
            createdAt = d.createdAt, completedAt = d.completedAt
        )
    }
}

// ReviewCommentEntity.kt
package com.codeai.infrastructure.persistence.review

import com.codeai.domain.review.ReviewComment
import com.codeai.domain.review.ReviewSeverity
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "review_comments")
class ReviewCommentEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "code_review_id", nullable = false)
    val codeReviewId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val severity: ReviewSeverity,

    @Column(name = "file_path", nullable = false)
    val filePath: String,

    @Column(name = "line_number")
    val lineNumber: Int? = null,

    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,

    @Column(columnDefinition = "TEXT")
    val suggestion: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = ReviewComment(
        id = id, codeReviewId = codeReviewId, severity = severity,
        filePath = filePath, lineNumber = lineNumber,
        content = content, suggestion = suggestion, createdAt = createdAt
    )

    companion object {
        fun from(d: ReviewComment) = ReviewCommentEntity(
            id = d.id, codeReviewId = d.codeReviewId, severity = d.severity,
            filePath = d.filePath, lineNumber = d.lineNumber,
            content = d.content, suggestion = d.suggestion, createdAt = d.createdAt
        )
    }
}
```

- [ ] **Step 6: Write CodeReviewJpaRepository.kt + CodeReviewRepositoryImpl.kt**

```kotlin
// CodeReviewJpaRepository.kt
package com.codeai.infrastructure.persistence.review

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface CodeReviewJpaRepository : JpaRepository<CodeReviewEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): Optional<CodeReviewEntity>
}

interface ReviewCommentJpaRepository : JpaRepository<ReviewCommentEntity, Long> {
    fun findByCodeReviewId(codeReviewId: Long): List<ReviewCommentEntity>
}

// CodeReviewRepositoryImpl.kt
package com.codeai.infrastructure.persistence.review

import com.codeai.domain.review.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository

@Repository
class CodeReviewRepositoryImpl(
    private val reviewJpa: CodeReviewJpaRepository,
    private val commentJpa: ReviewCommentJpaRepository
) : CodeReviewRepository {

    override suspend fun save(review: CodeReview): CodeReview =
        withContext(Dispatchers.IO) {
            reviewJpa.save(CodeReviewEntity.from(review)).toDomain()
        }

    override suspend fun saveComment(comment: ReviewComment): ReviewComment =
        withContext(Dispatchers.IO) {
            commentJpa.save(ReviewCommentEntity.from(comment)).toDomain()
        }

    override suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): CodeReview? =
        withContext(Dispatchers.IO) {
            reviewJpa.findByPipelineExecutionId(pipelineExecutionId).orElse(null)?.toDomain()
        }

    override suspend fun findCommentsByReviewId(reviewId: Long): List<ReviewComment> =
        withContext(Dispatchers.IO) {
            commentJpa.findByCodeReviewId(reviewId).map { it.toDomain() }
        }
}
```

- [ ] **Step 7: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/domain/review/ \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/review/
git commit -m "feat: review domain + JPA persistence"
```

---

## Task 10: Claude API Integration

**Files:**
- Create: `infrastructure/ai/ClaudeReviewPrompt.kt`
- Create: `infrastructure/ai/MaskingUtil.kt`
- Create: `infrastructure/ai/DiffTokenizer.kt`
- Create: `infrastructure/ai/ClaudeApiClient.kt`
- Test: `src/test/kotlin/com/codeai/infrastructure/ai/ClaudeReviewPromptTest.kt`
- Test: `src/test/kotlin/com/codeai/infrastructure/ai/MaskingUtilTest.kt`

- [ ] **Step 1: Write MaskingUtilTest.kt (failing)**

```kotlin
package com.codeai.infrastructure.ai

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class MaskingUtilTest {

    @Test
    fun `API 키 패턴이 마스킹된다`() {
        val diff = "API_KEY=sk-ant-api03-realkey123"
        val masked = MaskingUtil.mask(diff)
        assertFalse(masked.contains("realkey123"))
        assertTrue(masked.contains("***MASKED***"))
    }

    @Test
    fun `민감 정보 없으면 원문 반환`() {
        val diff = "fun hello() = println(\"world\")"
        assertEquals(diff, MaskingUtil.mask(diff))
    }
}
```

- [ ] **Step 2: Write MaskingUtil.kt**

```kotlin
package com.codeai.infrastructure.ai

object MaskingUtil {
    private val patterns = listOf(
        Regex("((?:API_KEY|SECRET|PASSWORD|TOKEN|AUTH)\\s*=\\s*)([^\\s\"']+)", RegexOption.IGNORE_CASE),
        Regex("(sk-ant-api[0-9A-Za-z-]+)"),
        Regex("(ghp_[0-9A-Za-z]+)"),
        Regex("(xoxb-[0-9A-Za-z-]+)")
    )

    fun mask(content: String): String {
        var result = content
        for (pattern in patterns) {
            result = pattern.replace(result) { matchResult ->
                if (matchResult.groupValues.size > 2) {
                    matchResult.groupValues[1] + "***MASKED***"
                } else {
                    "***MASKED***"
                }
            }
        }
        return result
    }
}
```

- [ ] **Step 3: Run MaskingUtil test — 통과 확인**

```bash
./gradlew test --tests "com.codeai.infrastructure.ai.MaskingUtilTest"
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Write ClaudeReviewPrompt.kt**

```kotlin
package com.codeai.infrastructure.ai

object ClaudeReviewPrompt {

    fun build(diff: String, version: String): String = when (version) {
        "v1" -> buildV1(diff)
        "v2" -> buildV2(diff)
        else -> buildV3(diff)
    }

    private fun buildV1(diff: String) = """
        이 코드를 리뷰해줘:
        $diff
    """.trimIndent()

    private fun buildV2(diff: String) = """
        Kotlin Spring Boot 코드입니다.
        보안 취약점, null-safety, 성능 이슈 중심으로 리뷰해주세요.
        
        코드:
        $diff
    """.trimIndent()

    private fun buildV3(diff: String) = """
        당신은 Kotlin + Spring Boot 전문 시니어 개발자입니다.
        아래 PR diff를 분석해 코드리뷰를 JSON 형식으로 작성해주세요.
        
        리뷰 기준:
        - 보안 취약점 (SQL Injection, XSS, 인증/인가 누락)
        - Kotlin null-safety (NPE 가능성, !! 연산자 남용)
        - 성능 이슈 (N+1 쿼리, 불필요한 블로킹 호출)
        - 코드 품질 (중복 코드, 단일 책임 원칙 위반)
        
        응답 형식 (반드시 JSON만 반환, 마크다운 코드블록 없이):
        {
          "issues": [
            {
              "severity": "HIGH|MEDIUM|LOW",
              "filePath": "파일 경로",
              "lineNumber": 줄번호 또는 null,
              "content": "이슈 설명",
              "suggestion": "수정 예시 코드 또는 null"
            }
          ]
        }
        
        이슈가 없으면: {"issues": []}
        
        코드 diff:
        $diff
    """.trimIndent()
}
```

- [ ] **Step 5: Write DiffTokenizer.kt**

```kotlin
package com.codeai.infrastructure.ai

object DiffTokenizer {

    fun splitByTokenBudget(diff: String, maxTokens: Int): List<String> {
        // 대략 4자 = 1 토큰으로 추정
        val approxCharsPerToken = 4
        val maxChars = maxTokens * approxCharsPerToken

        if (diff.length <= maxChars) return listOf(diff)

        val chunks = mutableListOf<String>()
        val lines = diff.lines()
        val currentChunk = StringBuilder()

        for (line in lines) {
            if (currentChunk.length + line.length + 1 > maxChars) {
                if (currentChunk.isNotEmpty()) {
                    chunks.add(currentChunk.toString())
                    currentChunk.clear()
                }
            }
            currentChunk.appendLine(line)
        }

        if (currentChunk.isNotEmpty()) chunks.add(currentChunk.toString())
        return chunks
    }
}
```

- [ ] **Step 6: Write ClaudeApiClient.kt**

```kotlin
package com.codeai.infrastructure.ai

import com.codeai.domain.review.ReviewComment
import com.codeai.domain.review.ReviewSeverity
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class ClaudeApiClient(
    @Value("\${claude.api.key}") private val apiKey: String,
    @Value("\${claude.api.max-tokens}") private val maxTokens: Int,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    private val webClient = WebClient.builder()
        .baseUrl("https://api.anthropic.com")
        .defaultHeader("x-api-key", apiKey)
        .defaultHeader("anthropic-version", "2023-06-01")
        .defaultHeader("Content-Type", "application/json")
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    suspend fun review(diff: String, promptVersion: String): ReviewResult {
        val maskedDiff = MaskingUtil.mask(diff)
        val chunks = DiffTokenizer.splitByTokenBudget(maskedDiff, maxTokens)

        val allComments = mutableListOf<ParsedComment>()
        var totalTokens = 0

        for (chunk in chunks) {
            val prompt = ClaudeReviewPrompt.build(chunk, promptVersion)
            val result = callApi(prompt)
            allComments.addAll(result.comments)
            totalTokens += result.tokensUsed
        }

        return ReviewResult(allComments, totalTokens)
    }

    private suspend fun callApi(prompt: String): ApiCallResult {
        val requestBody = mapOf(
            "model" to "claude-sonnet-4-20250514",
            "max_tokens" to maxTokens,
            "messages" to listOf(mapOf("role" to "user", "content" to prompt))
        )

        val response = webClient.post()
            .uri("/v1/messages")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .awaitSingle()

        val content = (response["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
        val text = content?.get("text") as? String ?: return ApiCallResult(emptyList(), 0)

        val usage = response["usage"] as? Map<*, *>
        val tokensUsed = ((usage?.get("input_tokens") as? Int) ?: 0) +
                ((usage?.get("output_tokens") as? Int) ?: 0)

        val comments = parseComments(text)
        return ApiCallResult(comments, tokensUsed)
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseComments(jsonText: String): List<ParsedComment> {
        return try {
            val cleanJson = jsonText.trim()
                .removePrefix("```json").removePrefix("```")
                .removeSuffix("```").trim()
            val parsed = objectMapper.readValue(cleanJson, Map::class.java)
            val issues = parsed["issues"] as? List<Map<String, Any?>> ?: emptyList()
            issues.map { issue ->
                ParsedComment(
                    severity = ReviewSeverity.valueOf(issue["severity"] as? String ?: "LOW"),
                    filePath = issue["filePath"] as? String ?: "unknown",
                    lineNumber = (issue["lineNumber"] as? Number)?.toInt(),
                    content = issue["content"] as? String ?: "",
                    suggestion = issue["suggestion"] as? String
                )
            }
        } catch (e: Exception) {
            log.warn("Claude 응답 파싱 실패: ${e.message}")
            emptyList()
        }
    }
}

data class ParsedComment(
    val severity: ReviewSeverity,
    val filePath: String,
    val lineNumber: Int?,
    val content: String,
    val suggestion: String?
)

data class ReviewResult(val comments: List<ParsedComment>, val tokensUsed: Int)
data class ApiCallResult(val comments: List<ParsedComment>, val tokensUsed: Int)
```

- [ ] **Step 7: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/ai/ \
        codeai-backend/src/test/kotlin/com/codeai/infrastructure/ai/
git commit -m "feat: Claude API client - prompt versioning, diff chunking, response parsing"
```

---

## Task 11: GitHub API Integration

**Files:**
- Create: `infrastructure/github/GitHubApiClient.kt`
- Create: `infrastructure/github/GitHubPrCommentClient.kt`

- [ ] **Step 1: Write GitHubApiClient.kt**

```kotlin
package com.codeai.infrastructure.github

import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class GitHubApiClient(
    @Value("\${github.token}") private val token: String
) {
    private val webClient = WebClient.builder()
        .baseUrl("https://api.github.com")
        .defaultHeader("Authorization", "Bearer $token")
        .defaultHeader("Accept", "application/vnd.github.v3+json")
        .codecs { it.defaultCodecs().maxInMemorySize(10 * 1024 * 1024) }
        .build()

    suspend fun getPrDiff(repoFullName: String, prNumber: Int): String {
        return webClient.get()
            .uri("/repos/$repoFullName/pulls/$prNumber")
            .header("Accept", "application/vnd.github.v3.diff")
            .retrieve()
            .bodyToMono(String::class.java)
            .awaitSingle()
    }
}
```

- [ ] **Step 2: Write GitHubPrCommentClient.kt**

```kotlin
package com.codeai.infrastructure.github

import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class GitHubPrCommentClient(
    @Value("\${github.token}") private val token: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    private val webClient = WebClient.builder()
        .baseUrl("https://api.github.com")
        .defaultHeader("Authorization", "Bearer $token")
        .defaultHeader("Accept", "application/vnd.github.v3+json")
        .build()

    suspend fun createComment(repoFullName: String, prNumber: Int, body: String): Long? {
        return try {
            val response = webClient.post()
                .uri("/repos/$repoFullName/issues/$prNumber/comments")
                .bodyValue(mapOf("body" to body))
                .retrieve()
                .bodyToMono(Map::class.java)
                .awaitSingle()
            (response["id"] as? Number)?.toLong()
        } catch (e: Exception) {
            log.error("GitHub PR 코멘트 등록 실패: $repoFullName#$prNumber", e)
            null
        }
    }

    fun buildReviewBody(
        highCount: Int, mediumCount: Int, lowCount: Int,
        comments: List<CommentItem>
    ): String {
        val sb = StringBuilder()
        sb.appendLine("## 🤖 코디(Code AI) 코드리뷰")
        sb.appendLine()
        sb.appendLine("| 심각도 | 건수 |")
        sb.appendLine("|--------|------|")
        sb.appendLine("| 🔴 HIGH | $highCount |")
        sb.appendLine("| 🟡 MEDIUM | $mediumCount |")
        sb.appendLine("| 🟢 LOW | $lowCount |")
        sb.appendLine()

        if (comments.isEmpty()) {
            sb.appendLine("✅ 이슈가 발견되지 않았습니다.")
        } else {
            comments.take(20).forEach { c ->
                val icon = when (c.severity) { "HIGH" -> "🔴"; "MEDIUM" -> "🟡"; else -> "🟢" }
                sb.appendLine("### $icon [${c.severity}] `${c.filePath}`${c.lineNumber?.let { ":$it" } ?: ""}")
                sb.appendLine(c.content)
                c.suggestion?.let {
                    sb.appendLine()
                    sb.appendLine("**수정 예시:**")
                    sb.appendLine("```kotlin")
                    sb.appendLine(it)
                    sb.appendLine("```")
                }
                sb.appendLine()
            }
        }
        return sb.toString()
    }
}

data class CommentItem(
    val severity: String,
    val filePath: String,
    val lineNumber: Int?,
    val content: String,
    val suggestion: String?
)
```

- [ ] **Step 3: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/github/
git commit -m "feat: GitHub API client - PR diff + PR comment integration"
```

---

## Task 12: Review Use Case

**Files:**
- Create: `application/review/ReviewUseCase.kt`

- [ ] **Step 1: Write ReviewUseCase.kt**

```kotlin
package com.codeai.application.review

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.review.*
import com.codeai.infrastructure.ai.ClaudeApiClient
import com.codeai.infrastructure.github.CommentItem
import com.codeai.infrastructure.github.GitHubApiClient
import com.codeai.infrastructure.github.GitHubPrCommentClient
import com.codeai.application.notification.NotifyUseCase
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ReviewUseCase(
    private val pipelineRepository: PipelineRepository,
    private val reviewRepository: CodeReviewRepository,
    private val gitHubApiClient: GitHubApiClient,
    private val gitHubPrCommentClient: GitHubPrCommentClient,
    private val claudeApiClient: ClaudeApiClient,
    private val notifyUseCase: NotifyUseCase,
    @Value("\${codeai.review.prompt-version:v3}") private val promptVersion: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun execute(
        pipelineExecutionId: Long,
        repoFullName: String,
        prNumber: Int,
        headSha: String,
        prUrl: String,
        prTitle: String
    ) {
        // PipelineExecution 상태를 RUNNING으로 변경
        val execution = pipelineRepository.findById(pipelineExecutionId)
            ?: throw NoSuchElementException("PipelineExecution not found: $pipelineExecutionId")
        pipelineRepository.save(execution.start())

        // CodeReview 레코드 생성 (PENDING)
        var review = reviewRepository.save(
            CodeReview(pipelineExecutionId = pipelineExecutionId, promptVersion = promptVersion)
        )

        try {
            // 1. PR diff 가져오기
            val diff = gitHubApiClient.getPrDiff(repoFullName, prNumber)
            log.info("PR diff 획득: repoFullName=$repoFullName, PR#$prNumber, diff=${diff.length}chars")

            // 2. Claude API 코드리뷰
            val reviewResult = claudeApiClient.review(diff, promptVersion)
            log.info("Claude 리뷰 완료: ${reviewResult.comments.size}건, tokens=${reviewResult.tokensUsed}")

            // 3. 리뷰 코멘트 저장
            val savedComments = reviewResult.comments.map { parsed ->
                reviewRepository.saveComment(
                    ReviewComment(
                        codeReviewId = review.id,
                        severity = parsed.severity,
                        filePath = parsed.filePath,
                        lineNumber = parsed.lineNumber,
                        content = parsed.content,
                        suggestion = parsed.suggestion
                    )
                )
            }

            // 4. GitHub PR 코멘트 등록
            val commentItems = savedComments.map {
                CommentItem(it.severity.name, it.filePath, it.lineNumber, it.content, it.suggestion)
            }
            val commentBody = gitHubPrCommentClient.buildReviewBody(
                savedComments.count { it.severity == ReviewSeverity.HIGH },
                savedComments.count { it.severity == ReviewSeverity.MEDIUM },
                savedComments.count { it.severity == ReviewSeverity.LOW },
                commentItems
            )
            val githubCommentId = gitHubPrCommentClient.createComment(repoFullName, prNumber, commentBody)

            // 5. CodeReview 완료 상태 저장
            review = reviewRepository.save(
                review.complete(savedComments, reviewResult.tokensUsed, githubCommentId)
            )

            // 6. PipelineExecution 완료
            pipelineRepository.save(execution.complete())

            // 7. 도메인 이벤트 → Notify
            val event = ReviewCompleted(
                pipelineExecutionId = pipelineExecutionId,
                codeReviewId = review.id,
                highCount = review.highCount,
                mediumCount = review.mediumCount,
                lowCount = review.lowCount,
                prUrl = prUrl,
                prTitle = prTitle
            )
            notifyUseCase.onReviewCompleted(event)

        } catch (e: Exception) {
            log.error("코드리뷰 실패: pipelineExecutionId=$pipelineExecutionId", e)
            reviewRepository.save(review.fail())
            pipelineRepository.save(execution.fail())
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/application/review/
git commit -m "feat: ReviewUseCase - full pipeline (diff → Claude → GitHub comment → event)"
```

---

## Task 13: Notification Domain + Persistence

**Files:**
- Create: `domain/notification/NotificationChannel.kt`
- Create: `domain/notification/NotificationMessage.kt`
- Create: `domain/notification/NotificationRepository.kt`
- Create: `infrastructure/persistence/notification/NotificationMessageEntity.kt`
- Create: `infrastructure/persistence/notification/NotificationJpaRepository.kt`
- Create: `infrastructure/persistence/notification/NotificationRepositoryImpl.kt`

- [ ] **Step 1: Write notification domain**

```kotlin
// NotificationChannel.kt
package com.codeai.domain.notification

enum class NotificationChannel { SLACK, GITHUB }

enum class NotificationStatus { PENDING, SENT, FAILED }

// NotificationMessage.kt
package com.codeai.domain.notification

import java.time.LocalDateTime

data class NotificationMessage(
    val id: Long = 0,
    val pipelineExecutionId: Long,
    val channel: NotificationChannel,
    val message: String,
    val status: NotificationStatus = NotificationStatus.PENDING,
    val sentAt: LocalDateTime? = null,
    val errorMessage: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun markSent() = copy(status = NotificationStatus.SENT, sentAt = LocalDateTime.now())
    fun markFailed(error: String) = copy(status = NotificationStatus.FAILED, errorMessage = error)
}

// NotificationRepository.kt
package com.codeai.domain.notification

interface NotificationRepository {
    suspend fun save(message: NotificationMessage): NotificationMessage
    suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): List<NotificationMessage>
}
```

- [ ] **Step 2: Write notification persistence**

```kotlin
// NotificationMessageEntity.kt
package com.codeai.infrastructure.persistence.notification

import com.codeai.domain.notification.*
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "notification_messages")
class NotificationMessageEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "pipeline_execution_id", nullable = false)
    val pipelineExecutionId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val channel: NotificationChannel,

    @Column(nullable = false, columnDefinition = "TEXT")
    val message: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: NotificationStatus = NotificationStatus.PENDING,

    @Column(name = "sent_at")
    var sentAt: LocalDateTime? = null,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = NotificationMessage(
        id = id, pipelineExecutionId = pipelineExecutionId,
        channel = channel, message = message, status = status,
        sentAt = sentAt, errorMessage = errorMessage, createdAt = createdAt
    )

    companion object {
        fun from(d: NotificationMessage) = NotificationMessageEntity(
            id = d.id, pipelineExecutionId = d.pipelineExecutionId,
            channel = d.channel, message = d.message, status = d.status,
            sentAt = d.sentAt, errorMessage = d.errorMessage, createdAt = d.createdAt
        )
    }
}

// NotificationJpaRepository.kt
package com.codeai.infrastructure.persistence.notification

import org.springframework.data.jpa.repository.JpaRepository

interface NotificationJpaRepository : JpaRepository<NotificationMessageEntity, Long> {
    fun findByPipelineExecutionId(pipelineExecutionId: Long): List<NotificationMessageEntity>
}

// NotificationRepositoryImpl.kt
package com.codeai.infrastructure.persistence.notification

import com.codeai.domain.notification.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Repository

@Repository
class NotificationRepositoryImpl(
    private val jpa: NotificationJpaRepository
) : NotificationRepository {

    override suspend fun save(message: NotificationMessage): NotificationMessage =
        withContext(Dispatchers.IO) {
            jpa.save(NotificationMessageEntity.from(message)).toDomain()
        }

    override suspend fun findByPipelineExecutionId(pipelineExecutionId: Long): List<NotificationMessage> =
        withContext(Dispatchers.IO) {
            jpa.findByPipelineExecutionId(pipelineExecutionId).map { it.toDomain() }
        }
}
```

- [ ] **Step 3: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/domain/notification/ \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/notification/
git commit -m "feat: notification domain + JPA persistence"
```

---

## Task 14: Slack Client + NotifyUseCase

**Files:**
- Create: `infrastructure/slack/SlackWebhookClient.kt`
- Create: `infrastructure/slack/SlackMessageBuilder.kt`
- Create: `application/notification/NotifyUseCase.kt`

- [ ] **Step 1: Write SlackWebhookClient.kt**

```kotlin
package com.codeai.infrastructure.slack

import kotlinx.coroutines.reactor.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

@Component
class SlackWebhookClient(
    @Value("\${slack.webhook.url}") private val webhookUrl: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)
    private val webClient = WebClient.builder().build()

    suspend fun send(payload: Map<String, Any>): Boolean {
        return try {
            webClient.post()
                .uri(webhookUrl)
                .bodyValue(payload)
                .retrieve()
                .toBodilessEntity()
                .awaitSingle()
            true
        } catch (e: Exception) {
            log.error("Slack 메시지 발송 실패", e)
            false
        }
    }
}
```

- [ ] **Step 2: Write SlackMessageBuilder.kt**

```kotlin
package com.codeai.infrastructure.slack

import com.codeai.domain.event.ReviewCompleted

object SlackMessageBuilder {

    fun buildReviewMessage(event: ReviewCompleted): Map<String, Any> {
        val status = if (event.highCount == 0) "✅ 리뷰 통과" else "⚠️ HIGH 이슈 ${event.highCount}건"
        val color = if (event.highCount == 0) "#36a64f" else "#ff0000"

        return mapOf(
            "text" to "코디(Code AI) 코드리뷰 완료: *${event.prTitle}*",
            "attachments" to listOf(
                mapOf(
                    "color" to color,
                    "fields" to listOf(
                        mapOf("title" to "상태", "value" to status, "short" to true),
                        mapOf("title" to "HIGH", "value" to event.highCount.toString(), "short" to true),
                        mapOf("title" to "MEDIUM", "value" to event.mediumCount.toString(), "short" to true),
                        mapOf("title" to "LOW", "value" to event.lowCount.toString(), "short" to true),
                        mapOf("title" to "PR 링크", "value" to event.prUrl, "short" to false)
                    )
                )
            )
        )
    }
}
```

- [ ] **Step 3: Write NotifyUseCase.kt**

```kotlin
package com.codeai.application.notification

import com.codeai.domain.event.ReviewCompleted
import com.codeai.domain.notification.NotificationChannel
import com.codeai.domain.notification.NotificationMessage
import com.codeai.domain.notification.NotificationRepository
import com.codeai.infrastructure.slack.SlackMessageBuilder
import com.codeai.infrastructure.slack.SlackWebhookClient
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class NotifyUseCase(
    private val notificationRepository: NotificationRepository,
    private val slackWebhookClient: SlackWebhookClient,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun onReviewCompleted(event: ReviewCompleted) {
        val payload = SlackMessageBuilder.buildReviewMessage(event)
        val messageText = objectMapper.writeValueAsString(payload)

        var notification = notificationRepository.save(
            NotificationMessage(
                pipelineExecutionId = event.pipelineExecutionId,
                channel = NotificationChannel.SLACK,
                message = messageText
            )
        )

        val sent = slackWebhookClient.send(payload)
        notification = if (sent) {
            notificationRepository.save(notification.markSent())
        } else {
            notificationRepository.save(notification.markFailed("Slack 발송 실패"))
        }

        log.info("Slack 알림 ${if (sent) "발송 완료" else "실패"}: pipelineId=${event.pipelineExecutionId}")
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/slack/ \
        codeai-backend/src/main/kotlin/com/codeai/application/notification/
git commit -m "feat: Slack webhook client + NotifyUseCase"
```

---

## Task 15: Pipeline Query API

**Files:**
- Create: `presentation/pipeline/PipelineResponse.kt`
- Create: `presentation/pipeline/PipelineController.kt`
- Create: `application/pipeline/PipelineQueryUseCase.kt`
- Create: `application/pipeline/PipelineStatsUseCase.kt`
- Create: `infrastructure/cache/PipelineCacheService.kt`

- [ ] **Step 1: Write PipelineResponse.kt**

```kotlin
package com.codeai.presentation.pipeline

import com.codeai.domain.pipeline.PipelineExecution
import com.codeai.domain.review.CodeReview
import com.codeai.domain.notification.NotificationMessage
import java.time.LocalDateTime

data class PipelineListResponse(
    val content: List<PipelineSummary>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)

data class PipelineSummary(
    val id: Long,
    val repositoryFullName: String = "",
    val prNumber: Int,
    val prTitle: String,
    val prAuthor: String,
    val status: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val durationSeconds: Long?
) {
    companion object {
        fun from(e: PipelineExecution) = PipelineSummary(
            id = e.id, prNumber = e.prNumber, prTitle = e.prTitle,
            prAuthor = e.prAuthor, status = e.status.name,
            startedAt = e.startedAt, completedAt = e.completedAt,
            durationSeconds = e.durationSeconds
        )
    }
}

data class PipelineDetailResponse(
    val id: Long,
    val repositoryFullName: String = "",
    val prNumber: Int,
    val prTitle: String,
    val prUrl: String,
    val prAuthor: String,
    val headSha: String,
    val status: String,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val review: ReviewSummary?,
    val notifications: List<NotificationSummary>
)

data class ReviewSummary(
    val status: String,
    val promptVersion: String,
    val totalIssues: Int,
    val highCount: Int,
    val mediumCount: Int,
    val lowCount: Int,
    val tokensUsed: Int?,
    val comments: List<CommentSummary>
) {
    companion object {
        fun from(r: CodeReview, comments: List<com.codeai.domain.review.ReviewComment>) = ReviewSummary(
            status = r.status.name, promptVersion = r.promptVersion,
            totalIssues = r.totalIssues, highCount = r.highCount,
            mediumCount = r.mediumCount, lowCount = r.lowCount,
            tokensUsed = r.tokensUsed,
            comments = comments.map { CommentSummary.from(it) }
        )
    }
}

data class CommentSummary(
    val severity: String,
    val filePath: String,
    val lineNumber: Int?,
    val content: String,
    val suggestion: String?
) {
    companion object {
        fun from(c: com.codeai.domain.review.ReviewComment) = CommentSummary(
            severity = c.severity.name, filePath = c.filePath,
            lineNumber = c.lineNumber, content = c.content, suggestion = c.suggestion
        )
    }
}

data class NotificationSummary(
    val channel: String,
    val status: String,
    val sentAt: LocalDateTime?
) {
    companion object {
        fun from(n: NotificationMessage) = NotificationSummary(
            channel = n.channel.name, status = n.status.name, sentAt = n.sentAt
        )
    }
}

data class PipelineStatsResponse(
    val totalExecutions: Long,
    val successCount: Long,
    val failedCount: Long,
    val successRate: Double,
    val period: String
)
```

- [ ] **Step 2: Write PipelineQueryUseCase.kt**

```kotlin
package com.codeai.application.pipeline

import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.review.CodeReviewRepository
import com.codeai.domain.notification.NotificationRepository
import com.codeai.presentation.pipeline.*
import org.springframework.stereotype.Service

@Service
class PipelineQueryUseCase(
    private val pipelineRepository: PipelineRepository,
    private val reviewRepository: CodeReviewRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend fun getList(
        status: String?, from: String?, to: String?, page: Int, size: Int
    ): PipelineListResponse {
        val pageResult = pipelineRepository.findAll(status, from, to, page, size)
        return PipelineListResponse(
            content = pageResult.content.map { PipelineSummary.from(it) },
            totalElements = pageResult.totalElements,
            totalPages = pageResult.totalPages,
            currentPage = pageResult.currentPage
        )
    }

    suspend fun getDetail(id: Long): PipelineDetailResponse {
        val execution = pipelineRepository.findById(id)
            ?: throw NoSuchElementException("파이프라인을 찾을 수 없습니다: id=$id")

        val review = reviewRepository.findByPipelineExecutionId(id)
        val comments = review?.let { reviewRepository.findCommentsByReviewId(it.id) } ?: emptyList()
        val notifications = notificationRepository.findByPipelineExecutionId(id)

        return PipelineDetailResponse(
            id = execution.id, prNumber = execution.prNumber,
            prTitle = execution.prTitle, prUrl = execution.prUrl,
            prAuthor = execution.prAuthor, headSha = execution.headSha,
            status = execution.status.name, startedAt = execution.startedAt,
            completedAt = execution.completedAt,
            review = review?.let { ReviewSummary.from(it, comments) },
            notifications = notifications.map { NotificationSummary.from(it) }
        )
    }
}
```

- [ ] **Step 3: Write PipelineStatsUseCase.kt**

```kotlin
package com.codeai.application.pipeline

import com.codeai.domain.pipeline.PipelineRepository
import com.codeai.domain.pipeline.PipelineStatus
import com.codeai.presentation.pipeline.PipelineStatsResponse
import org.springframework.stereotype.Service

@Service
class PipelineStatsUseCase(
    private val pipelineRepository: PipelineRepository
) {
    suspend fun getStats(period: String): PipelineStatsResponse {
        val successCount = pipelineRepository.countByStatus(PipelineStatus.SUCCESS)
        val failedCount = pipelineRepository.countByStatus(PipelineStatus.FAILED)
        val runningCount = pipelineRepository.countByStatus(PipelineStatus.RUNNING)
        val pendingCount = pipelineRepository.countByStatus(PipelineStatus.PENDING)
        val total = successCount + failedCount + runningCount + pendingCount
        val successRate = if (total > 0) (successCount.toDouble() / total * 100) else 0.0

        return PipelineStatsResponse(
            totalExecutions = total,
            successCount = successCount,
            failedCount = failedCount,
            successRate = Math.round(successRate * 10) / 10.0,
            period = period
        )
    }
}
```

- [ ] **Step 4: Write PipelineController.kt**

```kotlin
package com.codeai.presentation.pipeline

import com.codeai.application.pipeline.PipelineQueryUseCase
import com.codeai.application.pipeline.PipelineStatsUseCase
import com.codeai.presentation.common.ApiResponse
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/pipelines")
class PipelineController(
    private val pipelineQueryUseCase: PipelineQueryUseCase,
    private val pipelineStatsUseCase: PipelineStatsUseCase
) {
    @GetMapping
    suspend fun getList(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<PipelineListResponse> {
        val result = pipelineQueryUseCase.getList(status, from, to, page, size.coerceAtMost(100))
        return ApiResponse.ok(result)
    }

    @GetMapping("/stats")
    suspend fun getStats(
        @RequestParam(defaultValue = "7d") period: String
    ): ApiResponse<PipelineStatsResponse> {
        val result = pipelineStatsUseCase.getStats(period)
        return ApiResponse.ok(result)
    }

    @GetMapping("/{id}")
    suspend fun getDetail(
        @PathVariable id: Long
    ): ApiResponse<PipelineDetailResponse> {
        val result = pipelineQueryUseCase.getDetail(id)
        return ApiResponse.ok(result)
    }
}
```

- [ ] **Step 5: Write PipelineCacheService.kt (stub)**

```kotlin
package com.codeai.infrastructure.cache

import org.springframework.stereotype.Service

@Service
class PipelineCacheService {
    // TTL 캐싱은 Week 4에서 구현
    // 현재는 pass-through
}
```

- [ ] **Step 6: Commit**

```bash
git add codeai-backend/src/main/kotlin/com/codeai/presentation/pipeline/ \
        codeai-backend/src/main/kotlin/com/codeai/application/pipeline/ \
        codeai-backend/src/main/kotlin/com/codeai/infrastructure/cache/
git commit -m "feat: Pipeline query API - GET /api/pipelines, /{id}, /stats"
```

---

## Task 16: 빌드 검증 + .env.example

**Files:**
- Create: `codeai-backend/.env.example`

- [ ] **Step 1: Write .env.example**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeai
DB_USER=codeai
DB_PASSWORD=codeai1234

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Claude API (https://console.anthropic.com)
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxx
CLAUDE_MAX_TOKENS=3000

# GitHub Personal Access Token
GITHUB_TOKEN=ghp_xxxxxxxx

# Slack Incoming Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Webhook HMAC Secret
WEBHOOK_SECRET=your-secret-here

# Internal API Key
CODEAI_API_KEY=codeai-local-key-12345

# Spring Profile
SPRING_PROFILES_ACTIVE=local
```

- [ ] **Step 2: Docker Compose로 인프라 실행**

```bash
cd codeai-backend
docker compose up -d postgres redis
docker compose ps
```

Expected:
```
NAME               STATUS
codeai-postgres    running
codeai-redis       running
```

- [ ] **Step 3: 빌드 검증**

```bash
./gradlew build -x test 2>&1 | tail -30
```

Expected: `BUILD SUCCESSFUL`

컴파일 에러가 나면 에러 메시지를 보고 수정 후 재시도.

- [ ] **Step 4: 서버 실행 확인**

```bash
SPRING_PROFILES_ACTIVE=local \
DB_USER=codeai DB_PASSWORD=codeai1234 DB_NAME=codeai \
CLAUDE_API_KEY=placeholder SLACK_WEBHOOK_URL=placeholder GITHUB_TOKEN=placeholder \
./gradlew bootRun
```

별도 터미널에서:
```bash
curl http://localhost:8080/actuator/health
```

Expected: `{"status":"UP"}`

- [ ] **Step 5: 전체 테스트 실행**

```bash
./gradlew test 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL` (HmacValidatorTest, MaskingUtilTest 포함)

- [ ] **Step 6: Final commit**

```bash
git add codeai-backend/.env.example
git commit -m "feat: backend MVP complete - Webhook + Redis Stream + Claude review + Slack notify + Pipeline API"
```

---

## 빠른 검증 시나리오 (서버 실행 후)

```bash
# 1. 헬스 체크
curl http://localhost:8080/actuator/health

# 2. Webhook 수신 테스트 (서명 검증 실패 케이스)
curl -X POST http://localhost:8080/webhook/github \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -H "Content-Type: application/json" \
  -d '{"action":"opened"}'
# Expected: {"success":false,"error":{"code":"WEBHOOK_SIGNATURE_INVALID",...}}

# 3. 파이프라인 목록 조회
curl http://localhost:8080/api/pipelines
# Expected: {"success":true,"data":{"content":[],...}}

# 4. 파이프라인 통계
curl http://localhost:8080/api/pipelines/stats
# Expected: {"success":true,"data":{"totalExecutions":0,...}}
```
