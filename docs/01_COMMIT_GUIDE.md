# 코디(Code AI) — Git 커밋 가이드

## 커밋 전략

기능 단위로 커밋을 묶어서 히스토리를 깔끔하게 유지합니다.  
각 커밋은 `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` 접두어를 사용합니다.

---

## 현재까지 작업 파일 목록 및 권장 커밋 순서

### Commit 1 — 프로젝트 기반 구조

```
git add codeai-backend/build.gradle.kts
git add codeai-backend/settings.gradle.kts
git add codeai-backend/gradle/
git add codeai-backend/gradlew
git add codeai-backend/gradlew.bat
git add codeai-backend/Dockerfile
git add codeai-backend/src/main/resources/application.yml
git add codeai-backend/src/main/resources/application-local.yml
git add codeai-backend/src/main/resources/application-prod.yml
git add codeai-backend/src/main/kotlin/com/codeai/CodeAiApplication.kt
git commit -m "chore: 프로젝트 초기 설정 — Gradle, Docker, 환경변수 구성"
```

### Commit 2 — DB 스키마 & Flyway 마이그레이션

```
git add codeai-backend/src/main/resources/db/migration/
git commit -m "feat: DB 스키마 정의 — Flyway V1~V4 마이그레이션"
```

### Commit 3 — 공통 레이어 (응답 포맷, 예외 처리)

```
git add codeai-backend/src/main/kotlin/com/codeai/presentation/common/
git commit -m "feat: 공통 ApiResponse 래퍼 및 GlobalExceptionHandler 구현"
```

### Commit 4 — 인프라 설정 (Redis, JPA, WebFlux, Prometheus/Swagger)

```
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/config/
git commit -m "feat: 인프라 설정 — Redis, JPA, WebFlux, Swagger, Spring Security"
```

### Commit 5 — JWT 인증 (Provider, Filter)

```
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/security/
git commit -m "feat: JWT 인증 필터 및 토큰 Provider 구현 (jjwt 0.12.6)"
```

### Commit 6 — 사용자 도메인 + 회원가입/로그인 API

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/user/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/user/
git add codeai-backend/src/main/kotlin/com/codeai/application/auth/
git add codeai-backend/src/main/kotlin/com/codeai/presentation/auth/
git commit -m "feat: 사용자 인증 — 회원가입/로그인/로그아웃 API, BCrypt(12) 해시"
```

### Commit 7 — 도메인 이벤트 정의

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/event/
git commit -m "feat: 도메인 이벤트 정의 — ReviewCompleted, TestRunCompleted, PipelineStarted/Completed"
```

### Commit 8 — Pipeline 도메인 + 퍼시스턴스

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/pipeline/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/pipeline/
git commit -m "feat: Pipeline 도메인 — PipelineExecution, PipelineStep, 상태 전이 및 JPA 구현"
```

### Commit 9 — Repository 도메인 + 퍼시스턴스

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/repository/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/repository/
git commit -m "feat: Repository 도메인 — GitHub 레포지토리 연동 JPA 구현"
```

### Commit 10 — GitHub Webhook 수신 (HMAC 검증 + Redis Stream)

```
git add codeai-backend/src/main/kotlin/com/codeai/presentation/webhook/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/queue/
git add codeai-backend/src/main/kotlin/com/codeai/application/webhook/
git commit -m "feat: GitHub Webhook 수신 — HMAC-SHA256 검증, Redis Stream Consumer Group"
```

### Commit 11 — AI 코드리뷰 (Claude API + GitHub PR 댓글)

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/review/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/review/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/ai/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/github/
git add codeai-backend/src/main/kotlin/com/codeai/application/review/
git commit -m "feat: AI 코드리뷰 — Claude API v1/v2/v3 프롬프트, diff 분할, GitHub PR 자동 댓글"
```

### Commit 12 — 알림 (Slack) + 도메인 이벤트 연동

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/notification/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/notification/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/slack/
git add codeai-backend/src/main/kotlin/com/codeai/application/notification/
git commit -m "feat: Slack 알림 — ReviewCompleted/TestRunCompleted 이벤트 구독, 메시지 발송"
```

### Commit 13 — TestRun 도메인 + Playwright 실행

```
git add codeai-backend/src/main/kotlin/com/codeai/domain/testrun/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/testrun/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/playwright/
git add codeai-backend/src/main/kotlin/com/codeai/application/testrun/
git commit -m "feat: E2E 테스트 — TestRun 도메인, Playwright Docker headless 실행 및 결과 파싱"
```

### Commit 14 — 배포 자동화 (GitHub Actions CD 트리거)

```
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/github/GitHubActionsClient.kt
git add codeai-backend/src/main/kotlin/com/codeai/application/deploy/
git commit -m "feat: 조건부 배포 — GitHub Actions workflow_dispatch 트리거 (HIGH=0 + 테스트 통과)"
```

### Commit 15 — 파이프라인 조회 API + Redis 캐싱

```
git add codeai-backend/src/main/kotlin/com/codeai/presentation/pipeline/
git add codeai-backend/src/main/kotlin/com/codeai/application/pipeline/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/cache/
git commit -m "feat: 파이프라인 조회 API — 목록/상세/통계, Redis TTL 60초 캐싱, dailyStats"
```

### Commit 16 — 설정 API (GitHub/Slack/Claude)

```
git add codeai-backend/src/main/kotlin/com/codeai/presentation/settings/
git add codeai-backend/src/main/kotlin/com/codeai/application/settings/
git add codeai-backend/src/main/kotlin/com/codeai/infrastructure/persistence/settings/
git commit -m "feat: 설정 API — GitHub Webhook Secret, Slack URL, Claude 프롬프트 버전 DB 저장"
```

### Commit 17 — 문서

```
git add docs/
git commit -m "docs: 커밋 가이드, 코드 학습 문서, 트러블슈팅, 프론트 협업, 로컬 테스트 가이드"
```

---

## .gitignore 확인 사항

아래 파일들이 `.gitignore`에 반드시 있어야 합니다.

```
.env
*.env
build/
.gradle/
```

`.env` 파일은 **절대** 커밋하지 마세요. 실제 API 키가 포함되어 있습니다.

---

## 브랜치 전략 (간소화)

```
main ─── 배포 가능한 안정 코드
  └── feat/auth       ← 기능 브랜치 (선택)
  └── feat/review
  └── feat/testrun
```

현재 규모(1인 백엔드)에서는 `main`에 직접 커밋해도 무방합니다.  
프론트팀과 협업 시작 후에는 `feat/`, `fix/` 브랜치를 나눠 PR 리뷰하는 것을 권장합니다.
