# 코디(Code AI) — 코드 학습 가이드

> 이 문서는 백엔드 코드를 처음부터 이해하기 위한 학습용 문서입니다.  
> DDD 4계층 구조를 기반으로 기능별로 설명합니다.

---

## 1. 전체 아키텍처 이해

### 요청 흐름

```
GitHub PR 생성
  → POST /webhook/github        (Presentation)
  → WebhookProcessUseCase       (Application)
  → Redis Stream 적재           (Infrastructure/queue)
  → RedisStreamConsumer (비동기) (Infrastructure/queue)
  → ReviewUseCase               (Application)
    → ClaudeApiClient           (Infrastructure/ai)
    → GitHubPrCommentClient     (Infrastructure/github)
    → ReviewCompleted 이벤트
  → TestRunUseCase              (Application)
    → PlaywrightRunner          (Infrastructure/playwright)
    → TestRunCompleted 이벤트
  → NotifyUseCase               (Application)
    → SlackWebhookClient        (Infrastructure/slack)
  → DeployUseCase               (Application)
    → GitHubActionsClient       (Infrastructure/github)
```

### 4계층 역할 요약

| 계층 | 패키지 | 역할 |
|------|--------|------|
| Presentation | `presentation/` | HTTP 요청 수신, 응답 직렬화. 비즈니스 로직 없음 |
| Application | `application/` | UseCase — 도메인 객체 조합, 트랜잭션 경계, 이벤트 발행 |
| Domain | `domain/` | 순수 비즈니스 규칙. 외부 의존성 없음 |
| Infrastructure | `infrastructure/` | DB/API/Redis/Slack 등 외부 시스템 연동 |

---

## 2. 파일별 상세 설명

---

### 진입점

#### `CodeAiApplication.kt`
```kotlin
@SpringBootApplication
@EnableScheduling  // RedisStreamConsumer의 @Scheduled 활성화
class CodeAiApplication
fun main(args: Array<String>) { runApplication<CodeAiApplication>(*args) }
```
- `@EnableScheduling`: 1초마다 Redis Stream 폴링하는 Consumer 스케줄러를 활성화

---

### Presentation Layer — 공통

#### `presentation/common/ApiResponse.kt`
모든 API 응답을 감싸는 제네릭 래퍼.
```kotlin
{ "success": true, "data": {...}, "message": "OK" }
{ "success": false, "error": { "code": "...", "message": "..." } }
```
- `ApiResponse.ok(data)` — 성공 응답
- `ApiResponse.fail(code, message)` — 실패 응답
- `@JsonInclude(NON_NULL)`: null 필드는 JSON에서 제외

#### `presentation/common/GlobalExceptionHandler.kt`
`@RestControllerAdvice`로 전역 예외를 잡아 `ApiResponse.fail()`로 변환.
- `IllegalArgumentException` → 400
- `NoSuchElementException` → 404
- `Exception` → 500

---

### Presentation Layer — 인증

#### `presentation/auth/AuthController.kt`
```
POST /api/auth/register  — 회원가입 (인증 불필요)
POST /api/auth/login     — 로그인, JWT 발급 (인증 불필요)
POST /api/auth/logout    — 로그아웃 안내 (JWT 필요)
```
- `suspend fun` 키워드: Spring WebFlux 코루틴 지원. 블로킹 없이 비동기 실행
- JWT는 stateless라 서버에 세션 없음. logout은 클라이언트가 토큰을 삭제하면 됨

#### `presentation/auth/AuthRequest.kt`
```kotlin
data class RegisterRequest(val email: String, val password: String, val name: String)
data class LoginRequest(val email: String, val password: String)
```

#### `presentation/auth/AuthResponse.kt`
```kotlin
data class AuthResponse(val token: String, val tokenType: String = "Bearer", ...)
```

---

### Presentation Layer — Webhook

#### `presentation/webhook/WebhookController.kt`
```
POST /webhook/github
```
- `X-Hub-Signature-256` 헤더로 HMAC-SHA256 서명 검증
- 검증 실패 → 403 즉시 반환
- 검증 성공 → `WebhookProcessUseCase.process()` 호출

#### `presentation/webhook/HmacValidator.kt`
```kotlin
fun validate(payload: String, signature: String): Boolean
```
- `@Value("\${codeai.webhook.secret}")`: `.env`의 `WEBHOOK_SECRET` 값 주입
- `MessageDigest.isEqual()`: 타이밍 공격 방지를 위한 상수 시간 비교

#### `presentation/webhook/WebhookRequest.kt`
GitHub Webhook JSON 페이로드 매핑용 data class 모음.
```
WebhookPayload → PullRequestPayload → HeadPayload, UserPayload
              → RepositoryPayload → OwnerPayload
```

---

### Presentation Layer — 파이프라인

#### `presentation/pipeline/PipelineController.kt`
```
GET /api/pipelines          — 목록 조회 (페이징, 상태/날짜 필터)
GET /api/pipelines/stats    — 성공률 통계
GET /api/pipelines/{id}     — 상세 조회 (steps + review + testRun + notifications)
```

#### `presentation/pipeline/PipelineResponse.kt`
응답 DTO 모음:
- `PipelineListResponse` — 페이지네이션 포함 목록
- `PipelineDetailResponse` — steps, review, testRun, notifications 포함 상세
- `PipelineStatsResponse` — 성공률, avgDurationSeconds, dailyStats 포함
- `StepSummary`, `ReviewSummary`, `TestRunSummary`, `NotificationSummary`, `DailyStat`

---

### Presentation Layer — 설정

#### `presentation/settings/SettingsController.kt`
```
GET  /api/settings           — GitHub/Slack/Claude 통합 조회
GET  /api/settings/github    — GitHub Webhook URL + 연동 레포 목록
PUT  /api/settings/github    — Webhook Secret 변경
GET  /api/settings/slack     — Slack Webhook URL 조회
PUT  /api/settings/slack     — Slack Webhook URL 저장
POST /api/settings/slack/test — Slack 테스트 메시지 발송
GET  /api/settings/claude    — Claude 프롬프트 버전/토큰 조회
PUT  /api/settings/claude    — Claude 프롬프트 버전/토큰 저장
```

---

### Application Layer

#### `application/auth/AuthUseCase.kt`
- `register()`: 이메일 중복 확인 → `BCryptPasswordEncoder(12)` 해시 → DB 저장 → JWT 발급
- `login()`: 이메일 조회 → BCrypt 비교 → JWT 발급
- `BCryptPasswordEncoder(cost=12)`: 해싱 강도. 높을수록 느리지만 안전. 12는 실무 표준

#### `application/webhook/WebhookProcessUseCase.kt`
- `PipelineExecution` 생성 (상태: PENDING)
- Redis Stream에 webhook 데이터 발행 (`RedisStreamProducer.publish()`)
- 핵심: Webhook 응답과 AI 처리를 **분리** → GitHub 30초 타임아웃 초과 방지

#### `application/review/ReviewUseCase.kt`
1. GitHub API로 PR diff 추출
2. 민감정보 마스킹 (`MaskingUtil`)
3. 토큰 예산 확인, 초과 시 청크 분할 (`DiffTokenizer`)
4. Claude API 호출 (`ClaudeApiClient`)
5. 결과 파싱, `CodeReview` 저장
6. GitHub PR에 댓글 등록 (`GitHubPrCommentClient`)
7. `ReviewCompleted` 이벤트 발행 → `NotifyUseCase.onReviewCompleted()` 호출

#### `application/testrun/TestRunUseCase.kt`
1. `TestRun` 생성 (상태: RUNNING)
2. `PlaywrightRunner.run()` 호출 (Docker headless)
3. 결과 파싱 → `TestCase` 저장
4. `TestRunCompleted` 이벤트 → Slack 알림

#### `application/notification/NotifyUseCase.kt`
- `onReviewCompleted()`: `ReviewCompleted` 이벤트 → `SlackMessageBuilder.buildReviewMessage()` → Slack 발송
- `onTestRunCompleted()`: `TestRunCompleted` 이벤트 → `SlackMessageBuilder.buildTestRunMessage()` → Slack 발송
- 발송 결과를 `NotificationMessage`로 DB 저장 (SENT/FAILED 상태 추적)

#### `application/deploy/DeployUseCase.kt`
- 조건 확인: `review.highCount == 0 AND testRun.status == PASSED`
- 조건 미충족 → `PipelineStep` SKIPPED 처리
- 조건 충족 → `GitHubActionsClient.triggerDeploy()` → GitHub Actions workflow_dispatch

#### `application/pipeline/PipelineQueryUseCase.kt`
- 파이프라인 목록/상세 조회. `PipelineCacheService`로 Redis 캐싱 (TTL 60초)
- 상세 조회 시 steps, review, testRun, notifications 모두 한 번에 조회

#### `application/settings/SettingsUseCase.kt`
- 설정값을 `system_settings` 테이블(KV 스토어)에서 읽고 씀
- Slack URL, Claude 프롬프트 버전, GitHub Webhook Secret을 런타임에 변경 가능

---

### Domain Layer

#### `domain/user/User.kt`
```kotlin
data class User(val id: Long, val email: String, val password: String, val name: String, val role: UserRole, ...)
enum class UserRole { USER, ADMIN }
```
- 도메인 객체는 JPA Entity가 아닌 순수 Kotlin data class
- Infrastructure 계층의 `UserEntity`가 JPA 처리 후 이 객체로 변환

#### `domain/pipeline/PipelineExecution.kt`
```kotlin
fun start() = copy(status = RUNNING, startedAt = now())
fun complete() = copy(status = SUCCESS, completedAt = now())
fun fail() = copy(status = FAILED, completedAt = now())
val durationSeconds: Long? get() = /* startedAt ~ completedAt 계산 */
```
- 상태 전이 메서드가 새 객체를 반환 (불변 객체 패턴)
- `durationSeconds`: 계산 프로퍼티로 DB에 저장 안 함

#### `domain/pipeline/PipelineStep.kt`
```kotlin
fun start() / fun succeed() / fun fail(error) / fun skip()
```
- WEBHOOK → REVIEW → TEST → NOTIFY → DEPLOY 각 단계를 기록

#### `domain/review/CodeReview.kt`
```kotlin
fun complete(comments, tokensUsed, githubCommentId) = copy(
    status = COMPLETED,
    highCount = comments.count { it.severity == HIGH },
    ...
)
```
- `complete()` 시 comments 집계를 도메인 내부에서 처리 (비즈니스 로직)

#### `domain/testrun/TestRun.kt`
```kotlin
fun complete(total, passed, failed, coverage?) = copy(
    status = if (failed == 0) PASSED else FAILED,
    ...
)
```

#### `domain/event/`
```kotlin
interface DomainEvent { val occurredAt: LocalDateTime }
data class ReviewCompleted(pipelineExecutionId, reviewId, prTitle, prUrl, highCount, mediumCount, lowCount, ...) : DomainEvent
data class TestRunCompleted(pipelineExecutionId, testRunId, passed, totalTests, failedCount, ...) : DomainEvent
```
- 도메인 이벤트는 "무슨 일이 일어났는가"를 표현하는 불변 데이터
- 느슨한 결합: Notification이 Review/TestRun을 직접 참조하지 않음

---

### Infrastructure Layer — 보안

#### `infrastructure/security/JwtProvider.kt`
```kotlin
fun generate(userId, email): String    // JWT 생성
fun validate(token): Boolean           // 서명 검증
fun getUserId(token): Long             // Subject 추출
fun getEmail(token): String            // Claim 추출
```
- `jjwt 0.12.6` 라이브러리 사용
- `Keys.hmacShaKeyFor(secret.toByteArray())`: `.env`의 `JWT_SECRET`으로 서명키 생성
- 만료 시간: `.env`의 `JWT_EXPIRATION_MS` (기본 86400000 = 24시간)

#### `infrastructure/security/JwtAuthFilter.kt`
- `WebFilter` 구현 (Spring Security WebFlux용)
- `Authorization: Bearer <token>` 헤더 파싱 → `JwtProvider.validate()` → 실패 시 401

#### `infrastructure/config/SecurityConfig.kt`
```kotlin
auth.pathMatchers("/api/auth/register", "/api/auth/login", "/webhook/github", ...).permitAll()
    .anyExchange().authenticated()
```
- 공개 경로: register, login, webhook, Swagger UI, actuator health
- 나머지 모든 경로: JWT 필수

---

### Infrastructure Layer — AI (Claude)

#### `infrastructure/ai/ClaudeApiClient.kt`
- `claude-sonnet-4-20250514` 모델 사용
- `messages` API 형식: `[{ "role": "user", "content": "<diff+prompt>" }]`
- 응답 JSON 파싱: `content[0].text` 추출 → 마크다운 코드블록 제거
- `ApiCallResult`: 성공/실패 + 토큰 사용량 포함

#### `infrastructure/ai/ClaudeReviewPrompt.kt`
프롬프트 버전별 템플릿:
- **v1**: "이 코드를 리뷰해줘" (기본)
- **v2**: 보안/null-safety/성능 항목 명시
- **v3**: HIGH/MEDIUM/LOW 심각도 분류 + 수정 예시 코드 포함 → PR 댓글로 즉시 사용 가능한 품질

#### `infrastructure/ai/DiffTokenizer.kt`
- diff를 파일 단위로 분할
- 최대 토큰 예산 초과 시 청크로 나눔 → Claude 호출 반복

#### `infrastructure/ai/MaskingUtil.kt`
- API 키, 비밀번호, 토큰 패턴을 정규식으로 감지 → `***MASKED***` 치환
- PR diff에 실수로 포함된 민감정보 보호

---

### Infrastructure Layer — GitHub

#### `infrastructure/github/GitHubApiClient.kt`
- `Accept: application/vnd.github.v3.diff`: PR diff를 텍스트로 받는 헤더
- `maxInMemorySize(10MB)`: 대용량 diff 처리를 위한 버퍼 설정

#### `infrastructure/github/GitHubPrCommentClient.kt`
- `POST /repos/{owner}/{repo}/issues/{pr_number}/comments`: PR에 댓글 등록
- 기존 댓글 확인 후 업데이트 (중복 방지)

#### `infrastructure/github/GitHubActionsClient.kt`
- `POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches`
- `workflow_dispatch` 이벤트 발생 → `deploy.yml` 워크플로우 트리거

---

### Infrastructure Layer — Redis

#### `infrastructure/queue/RedisStreamConfig.kt`
- `@PostConstruct`: 앱 시작 시 Consumer Group 생성
- `BUSYGROUP` 에러 무시: 이미 그룹이 존재할 때 재시작해도 안전

#### `infrastructure/queue/RedisStreamProducer.kt`
- `XADD codeai:webhook:events * field value ...`: Redis Stream에 이벤트 적재
- 반환값: message ID (예: `1718000000000-0`)

#### `infrastructure/queue/RedisStreamConsumer.kt`
- `@Scheduled(fixedDelay = 1000)`: 1초마다 폴링
- `XREADGROUP GROUP pipeline-workers worker-1 COUNT 1 STREAMS codeai:webhook:events >`
- 처리 성공 후 `XACK`로 확인 → 중복 처리 방지
- `>`: 아직 ACK되지 않은 새 메시지만 읽음

#### `infrastructure/cache/PipelineCacheService.kt`
```kotlin
suspend fun <T> getOrLoad(key, type, loader): T
```
- Redis에서 캐시 히트 → 반환
- 캐시 미스 → `loader()` 실행 → Redis에 60초 TTL로 저장
- 캐시 키: `pipeline:list:status:from:to:page:size`, `pipeline:detail:id`, `pipeline:stats`

---

### Infrastructure Layer — Slack

#### `infrastructure/slack/SlackWebhookClient.kt`
- Incoming Webhook URL로 POST 요청
- `webhookUrl` 파라미터로 받음 → `SettingsStore`에서 동적으로 조회 가능

#### `infrastructure/slack/SlackMessageBuilder.kt`
- `buildReviewMessage()`: 리뷰 결과 Slack 메시지 (색상 코드, 심각도별 카운트, PR 링크)
- `buildTestRunMessage()`: 테스트 결과 Slack 메시지 (통과/실패 수)

---

### Infrastructure Layer — Playwright

#### `infrastructure/playwright/PlaywrightRunner.kt`
```kotlin
suspend fun run(testFilter: String? = null): PlaywrightResult
```
- `useDocker=false` (로컬): `npx playwright test --reporter=json`
- `useDocker=true` (운영): Docker 컨테이너 내 실행
- `withTimeoutOrNull(timeoutMs)`: 120초 초과 시 강제 종료

#### `infrastructure/playwright/PlaywrightResultParser.kt`
- `parse(jsonOutput)`: Playwright JSON reporter 출력 파싱
- JSON 파싱 실패 시 텍스트 출력 fallback ("24 passed", "3 failed" 형식)
- `toDomainCases()`: 파싱 결과를 `TestCase` 도메인 객체로 변환

---

### Infrastructure Layer — 설정 저장소

#### `infrastructure/persistence/settings/SettingsStore.kt`
```kotlin
suspend fun get(key: String): String?
suspend fun set(key: String, value: String)
```
- `system_settings` 테이블 (key-value 구조)
- 런타임에 Slack URL, Claude 버전 등을 변경 가능

---

### Infrastructure Layer — JPA Entities

모든 Entity는 다음 패턴을 따릅니다:

```kotlin
// Entity (JPA용, DB 컬럼 매핑)
@Entity @Table(name = "pipeline_executions")
data class PipelineExecutionEntity(...) {
    fun toDomain(): PipelineExecution = ...   // Entity → Domain 변환
    companion object {
        fun from(d: PipelineExecution): PipelineExecutionEntity = ...  // Domain → Entity 변환
    }
}

// RepositoryImpl (도메인 인터페이스 구현)
@Repository
class PipelineRepositoryImpl(private val jpa: PipelineExecutionJpaRepository) : PipelineRepository {
    override suspend fun save(execution: PipelineExecution) = withContext(Dispatchers.IO) {
        jpa.save(PipelineExecutionEntity.from(execution)).toDomain()
    }
}
```

**왜 `withContext(Dispatchers.IO)`?**  
Spring WebFlux는 Non-blocking 기반이지만 JPA는 blocking입니다.  
`withContext(Dispatchers.IO)`로 JPA 호출을 IO 스레드 풀로 격리해 WebFlux 이벤트 루프를 블로킹하지 않습니다.

---

## 3. 코드 읽는 순서 (학습 추천)

1. `CodeAiApplication.kt` — 시작점
2. `presentation/common/ApiResponse.kt` — 응답 규격 이해
3. `domain/pipeline/PipelineExecution.kt` — 핵심 도메인 객체
4. `domain/event/*.kt` — 이벤트 패턴 이해
5. `presentation/webhook/WebhookController.kt` → `application/webhook/WebhookProcessUseCase.kt`
6. `infrastructure/queue/RedisStreamConsumer.kt` — 비동기 처리 흐름
7. `application/review/ReviewUseCase.kt` — 핵심 비즈니스 로직
8. `infrastructure/ai/ClaudeApiClient.kt` + `ClaudeReviewPrompt.kt`
9. `application/notification/NotifyUseCase.kt` — 이벤트 구독
10. `application/deploy/DeployUseCase.kt` — 조건부 배포
11. `application/pipeline/PipelineQueryUseCase.kt` + `PipelineCacheService.kt`
12. `infrastructure/security/JwtProvider.kt` + `JwtAuthFilter.kt`

---

## 4. 핵심 설계 결정 이유

| 결정 | 이유 |
|------|------|
| Webhook 응답 즉시 반환 + Redis 비동기 처리 | GitHub Webhook 30초 타임아웃 초과 방지. Claude API 호출은 수십 초 걸릴 수 있음 |
| Redis Stream Consumer Group | 정확히 1회 처리 보장. Worker 재시작 시 처리 중이던 이벤트 재처리 가능 |
| 도메인 이벤트 (ReviewCompleted, TestRunCompleted) | Notification이 Review/TestRun을 직접 참조하지 않음 → OCP 원칙. 채널 추가 시 코어 로직 변경 불필요 |
| JPA + WebFlux 공존, withContext(IO) | R2DBC 대신 JPA를 선택 (러닝커브 최소화). IO 스레드 격리로 이벤트 루프 보호 |
| BCrypt cost=12 | 로그인 속도(~300ms)와 보안의 균형. GPU 해킹 방어 |
| Redis KV로 설정 저장 | 설정값을 런타임에 변경 가능. 재배포 불필요 |
| Claude 프롬프트 v1/v2/v3 버전 관리 | 프롬프트 개선 이력 추적. DB의 code_reviews.prompt_version으로 어떤 버전이 어떤 결과를 냈는지 분석 가능 |
