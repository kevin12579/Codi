# 코디(Code AI) 백엔드 구현 스펙

> **기준 문서:** guide/코디_AtoZ_가이드라인.md, guide/코디_전체스펙.md, guide/코디_종합설계.md  
> **작성일:** 2026-06-11  
> **범위:** 백엔드 단독 (Kotlin + Spring Boot WebFlux)

---

## 1. 구현 목표

GitHub PR 이벤트 → AI 코드리뷰 → Slack 알림 → 자동 배포까지 이어지는 파이프라인을 처리하는 백엔드를 DDD 레이어 구조로 구현한다.

---

## 2. 기술 스택 (확정)

| 항목 | 기술 |
|------|------|
| 언어 | Kotlin 1.9.x, JDK 21 |
| 프레임워크 | Spring Boot 3.2.5 + WebFlux |
| DB | PostgreSQL 15 (JPA + Flyway) |
| 캐시/큐 | Redis 7 (Stream + Reactive) |
| AI | Claude API (`claude-sonnet-4-20250514`) |
| 알림 | Slack Incoming Webhook |
| 빌드 | Gradle 8.x Kotlin DSL |

---

## 3. 구현 순서 (Week 2 Must Have 우선)

### Phase 1 — 공통 레이어
- `CodeAiApplication.kt` 진입점
- `ApiResponse.kt` 공통 응답 래퍼 `{ success, data, message, error }`
- `GlobalExceptionHandler.kt` 전역 예외 처리
- `application.yml` / `application-local.yml` 설정 완성
- `V1__init_schema.sql` DB 스키마 (8개 테이블)

### Phase 2 — Webhook 수신 + HMAC 검증
- `HmacValidator.kt` — HMAC-SHA256 검증, 실패 시 403
- `WebhookController.kt` — POST `/webhook/github`, pull_request 이벤트만 처리
- `WebhookRequest.kt` — 페이로드 DTO

### Phase 3 — Redis Stream 큐 + Worker
- `RedisStreamConfig.kt` — Consumer Group 초기화
- `RedisStreamProducer.kt` — stream key: `codeai:webhook:events`
- `RedisStreamConsumer.kt` — Consumer Group: `pipeline-workers`, 1초 폴링
- `WebhookProcessUseCase.kt` — PipelineExecution 생성 (PENDING → RUNNING)
- Domain: `PipelineExecution`, `PipelineStep`, `PipelineStatus`, `StepType`
- Persistence: `PipelineExecutionEntity`, `PipelineRepositoryImpl`

### Phase 4 — Claude API 코드리뷰
- `ClaudeReviewPrompt.kt` — v1/v2/v3 프롬프트 버전 관리
- `DiffTokenizer.kt` — 토큰 초과 시 파일별 분할
- `MaskingUtil.kt` — 민감 데이터 마스킹
- `ClaudeApiClient.kt` — POST `/v1/messages`, JSON 응답 파싱
- `GitHubApiClient.kt` — PR diff 조회 (`GET /repos/{owner}/{repo}/pulls/{pr}/files`)
- `GitHubPrCommentClient.kt` — PR 코멘트 등록
- `ReviewUseCase.kt` — diff 추출 → Claude API → 심각도 분류 → GitHub 코멘트 → ReviewCompleted 이벤트 발행
- Domain: `CodeReview`, `ReviewComment`, `ReviewSeverity`, `ReviewStatus`
- Persistence: `CodeReviewEntity`, `ReviewCommentEntity`, `CodeReviewRepositoryImpl`

### Phase 5 — Slack 알림
- `SlackMessageBuilder.kt` — 리뷰 결과 + 테스트 결과 통합 메시지 구성
- `SlackWebhookClient.kt` — Slack Webhook POST
- `NotifyUseCase.kt` — ReviewCompleted + TestRunCompleted 이벤트 구독 → 통합 Slack 메시지 발송
- Domain: `NotificationMessage`, `NotificationChannel`
- Persistence: `NotificationRepositoryImpl`

### Phase 6 — 파이프라인 이력 저장 + 조회 API
- `PipelineQueryUseCase.kt` — 목록 조회 (상태/날짜 필터, 페이징)
- `PipelineStatsUseCase.kt` — 성공률 통계 (7d/30d/90d)
- `PipelineController.kt` — `GET /api/pipelines`, `/api/pipelines/{id}`, `/api/pipelines/stats`
- `PipelineCacheService.kt` — Redis 캐싱 TTL 60초

---

## 4. API 엔드포인트 (Must Have)

| Method | URL | 설명 | 인증 |
|--------|-----|------|------|
| POST | `/webhook/github` | GitHub PR 이벤트 수신 | HMAC-SHA256 |
| GET | `/api/pipelines` | 실행 이력 목록 (필터+페이징) | X-CodeAI-Key |
| GET | `/api/pipelines/{id}` | 실행 상세 (리뷰+테스트+알림 포함) | X-CodeAI-Key |
| GET | `/api/pipelines/stats` | 성공률 통계 | X-CodeAI-Key |
| GET | `/actuator/health` | 헬스 체크 | 없음 |

---

## 5. 공통 응답 형식

```json
{ "success": true, "data": {...}, "message": "OK" }
{ "success": false, "data": null, "error": { "code": "ERROR_CODE", "message": "설명" } }
```

---

## 6. 보안 설계

- Webhook: HMAC-SHA256 서명 검증 (`X-Hub-Signature-256`)
- API 인증: `X-CodeAI-Key` 헤더 검증 (JWT는 Phase 2 이후)
- 비밀번호: bcrypt(cost=12)
- Redis Stream Consumer Group으로 이벤트 중복 처리 방지
- Claude API diff 전처리 단계에서 API Key / 비밀번호 패턴 마스킹

---

## 7. 도메인 이벤트 흐름

```
ReviewUseCase.execute()   → ReviewCompleted 발행
TestRunUseCase.execute()  → TestRunCompleted 발행
NotifyUseCase             → 두 이벤트 수신 후 Slack 발송
DeployUseCase             → TestRunCompleted 조건 판단 → GitHub Actions 트리거
```

---

## 8. DB 스키마 요약 (8개 테이블)

`users`, `repositories`, `pipeline_executions`, `pipeline_steps`, `code_reviews`, `review_comments`, `test_runs`, `test_cases`, `notification_messages`

전체 DDL: `guide/코디_종합설계.md` 섹션 3-3 참조

---

## 9. 범위 외 (이번 구현에서 제외)

- JWT 인증 필터 (AuthController, JwtAuthFilter) — Should Have
- Playwright E2E 테스트 연동 — Should Have
- GitHub Actions CD 트리거 — Should Have
- Prometheus + Grafana 연동 — Nice to Have
- 멀티 레포지토리 지원 — Nice to Have
