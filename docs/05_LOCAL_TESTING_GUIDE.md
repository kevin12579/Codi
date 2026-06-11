# 코디(Code AI) — 실제 키 발급 & Docker 테스트 가이드

> 실제 API 키를 발급받고, Docker로 서버를 띄워서 눈으로 직접 확인하는 단계별 가이드입니다.

---

## 전체 흐름 요약

```
1단계: 실제 API 키 발급 (Claude, GitHub, Slack)
2단계: .env 파일에 실제 키 입력
3단계: Docker Compose로 서버 실행
4단계: 서비스별 동작 확인
5단계: Webhook 실제 연동 테스트 (ngrok)
6단계: 전체 파이프라인 End-to-End 테스트
```

---

## 1단계: 실제 API 키 발급

### 1-1. Claude (Anthropic) API 키

```
1. https://console.anthropic.com 접속
2. 로그인 후 [API Keys] 탭 클릭
3. [+ Create Key] 버튼 클릭
4. 이름 입력 (예: codeai-dev) → 생성
5. 키 복사: sk-ant-api03-xxxx (한 번만 보여주므로 바로 복사)
6. [Settings → Billing] 에서 크레딧 충전 (최소 $5 권장)
```

**확인:** 키가 `sk-ant-api03-`으로 시작하면 정상.

---

### 1-2. GitHub Personal Access Token (PAT)

```
1. GitHub 로그인 후 우상단 프로필 클릭
2. [Settings] → [Developer settings] → [Personal access tokens] → [Tokens (classic)]
3. [Generate new token (classic)] 클릭
4. 설정:
   - Note: codeai-dev
   - Expiration: 90 days (또는 No expiration)
   - Scopes 선택:
     ✅ repo (전체 선택 — 하위 항목 모두 포함)
     ✅ workflow (GitHub Actions 트리거용)
5. [Generate token] → 토큰 복사 (ghp_xxx)
```

**권한 설명:**
- `repo`: PR 댓글 작성, 코드 읽기
- `workflow`: GitHub Actions CD 트리거

---

### 1-3. Slack Incoming Webhook URL

```
1. https://api.slack.com/apps 접속
2. [Create New App] → [From scratch] 선택
3. App Name: "Codi AI", Workspace: 본인 워크스페이스 선택
4. [Incoming Webhooks] 클릭 → 토글 ON
5. [Add New Webhook to Workspace] 클릭
6. 알림 받을 채널 선택 (예: #codi-alerts)
7. Webhook URL 복사: https://hooks.slack.com/services/xxx/yyy/zzz
```

**테스트 (발급 직후 확인):**
```powershell
# PowerShell에서 테스트
$body = '{"text": "Codi 연동 테스트"}'
Invoke-WebRequest -Uri "https://hooks.slack.com/services/xxx/yyy/zzz" `
  -Method POST -Body $body -ContentType "application/json"
```
Slack 채널에 메시지가 오면 성공.

---

### 1-4. GitHub Webhook Secret (임의 문자열)

직접 만드는 값입니다. 발급이 필요 없습니다.

```powershell
# PowerShell에서 랜덤 시크릿 생성
-join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
# 출력 예: a8f2k9m3p7q1n4r6
```
이 값을 `WEBHOOK_SECRET`으로 사용합니다. GitHub Webhook 설정 시에도 동일하게 입력.

---

## 2단계: .env 파일 입력

프로젝트 루트의 `.env` 파일을 열어서 실제 값으로 교체합니다.

```
# 파일 위치: C:\Users\kevin\OneDrive\Desktop\smu\dev_source\GitWork\Codi\.env
```

```env
# ===========================
# 코디(Code AI) 실제 환경변수
# ===========================

# Database (그대로 사용 가능)
DB_USER=codeai
DB_PASSWORD=codeai1234
DB_NAME=codeai

# Redis (그대로 사용 가능)
REDIS_HOST=redis
REDIS_PORT=6379

# ↓ 여기서부터 실제 키로 교체 ↓

# Claude API 키 (1-1 에서 발급)
CLAUDE_API_KEY=sk-ant-api03-여기에실제키입력

# GitHub PAT (1-2 에서 발급)
GITHUB_TOKEN=ghp_여기에실제토큰입력

# Slack Webhook URL (1-3 에서 발급)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# 내부 API Key (임의 문자열, 변경 불필요)
CODEAI_API_KEY=codeai-local-key-12345

# Webhook Secret (1-4 에서 생성한 값)
WEBHOOK_SECRET=여기에랜덤문자열입력

# JWT Secret (임의의 긴 문자열, 변경 불필요)
JWT_SECRET=codeai-jwt-secret-key-must-be-at-least-256-bits-long-for-security

# Spring Profile
SPRING_PROFILES_ACTIVE=local
```

**주의:**
- `.env`는 절대 Git에 커밋하지 마세요 (`.gitignore`에 이미 포함됨)
- `WEBHOOK_SECRET`의 값을 메모해두세요 → 5단계에서 GitHub에 동일하게 입력

---

## 3단계: Docker Compose로 서버 실행

### 전제 조건 확인
```powershell
# Docker 설치 확인
docker --version    # Docker 24.x 이상
docker compose version  # v2.x 이상

# Docker Desktop이 실행 중인지 확인 (시스템 트레이에서)
```

### 처음 실행하는 경우

```powershell
# 프로젝트 루트로 이동
cd "C:\Users\kevin\OneDrive\Desktop\smu\dev_source\GitWork\Codi"

# 전체 서비스 빌드 + 실행 (최초 실행 시 5~10분 소요)
docker compose up --build

# 백그라운드 실행 원할 때
docker compose up --build -d
```

**빌드 로그에서 확인해야 할 것:**
```
✅ Successfully tagged codeai-api:latest
✅ Creating codeai-postgres ... done
✅ Creating codeai-redis    ... done
✅ Creating codeai-api      ... done
```

### 서버 시작 로그 확인

```powershell
docker compose logs -f api
```

**정상 시작 시 마지막 로그:**
```
Started CodeAiApplicationKt in 8.234 seconds (process running for 9.1)
```

**Flyway 마이그레이션 확인 (정상):**
```
Successfully applied 4 migrations to schema "public"
```

---

## 4단계: 서비스별 동작 확인

### 4-1. API 서버 헬스체크

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" | Select-Object -ExpandProperty Content
```

**예상 응답:**
```json
{"status": "UP"}
```

### 4-2. Swagger UI 접속

브라우저에서: `http://localhost:8080/swagger-ui.html`

- 모든 API 목록이 보이면 정상
- 서버가 안 뜨면 `docker compose logs api` 확인

### 4-3. 회원가입 + 로그인 테스트

**Swagger UI에서 직접 테스트:**

```
1. POST /api/auth/register
Body:
{
  "email": "test@codeai.com",
  "password": "Test1234!",
  "name": "테스트유저"
}
→ 201 Created 확인

2. POST /api/auth/login
Body:
{
  "email": "test@codeai.com",
  "password": "Test1234!"
}
→ 응답에서 token 값 복사

3. Swagger 우상단 [Authorize] → "Bearer {복사한토큰}" 입력
```

### 4-4. Claude API 연동 확인

로그에서 확인 (Webhook 이후 자동 실행되는 항목이라 직접 테스트 어려움):

```powershell
docker compose logs api | Select-String "Claude"
# 또는
docker compose logs api | Select-String "review"
```

**직접 확인:** 6단계에서 Webhook 테스트 후 파이프라인 상세에서 리뷰 결과 확인.

### 4-5. Slack 알림 테스트

```
Swagger UI에서:
POST /api/settings/slack
Body: {"webhookUrl": "https://hooks.slack.com/services/xxx/yyy/zzz"}
→ Slack URL 저장

POST /api/settings/slack/test
→ Slack 채널에 테스트 메시지 수신 확인
```

### 4-6. Redis 캐시 확인

```powershell
docker exec codeai-redis redis-cli PING
# 응답: PONG

# 파이프라인 조회 후 캐시 키 확인
docker exec codeai-redis redis-cli KEYS "pipeline:*"
```

### 4-7. Prometheus + Grafana

```
Prometheus: http://localhost:9090
→ 검색창에 "jvm_memory" 입력 → 데이터 확인

Grafana: http://localhost:3001
→ 기본 ID/PW: admin/admin
→ [Data Sources] → Prometheus URL: http://prometheus:9090
```

---

## 5단계: Webhook 실제 연동 (ngrok)

GitHub에서 실제 PR이 생성될 때 코디가 처리하도록 합니다.

### 5-1. ngrok 설치 및 실행

```powershell
# ngrok 설치 (설치되어 있지 않은 경우)
# https://ngrok.com 에서 다운로드 후 PATH에 추가
# 또는 winget으로 설치:
winget install ngrok

# ngrok 실행 (Docker 서버가 실행 중인 상태에서)
ngrok http 8080
```

**출력 화면:**
```
Session Status    online
Forwarding        https://abc123xyz.ngrok-free.app -> http://localhost:8080

# 이 URL 복사: https://abc123xyz.ngrok-free.app
```

### 5-2. GitHub Repository Webhook 설정

```
1. 연동할 GitHub 레포지토리 접속
2. [Settings] → [Webhooks] → [Add webhook]
3. 설정:
   - Payload URL: https://abc123xyz.ngrok-free.app/webhook/github
   - Content type: application/json
   - Secret: .env의 WEBHOOK_SECRET 값과 동일하게 입력
   - Events: [Let me select individual events] 선택 후:
     ✅ Pull requests
4. [Add webhook] 클릭
5. 초록색 체크마크 확인 → 연결 성공
```

### 5-3. Webhook 연동 즉시 확인

GitHub 레포지토리에서 테스트 PR 생성 시:
1. ngrok 로그에 요청 확인
2. `docker compose logs api` 에서 처리 로그 확인
3. `GET /api/pipelines` 에서 새 파이프라인 확인

---

## 6단계: 전체 파이프라인 End-to-End 테스트

### 정상 파이프라인 흐름

```
GitHub PR 생성
     ↓
POST /webhook/github (HMAC 검증)
     ↓
Redis Stream 발행
     ↓
WebhookConsumer 수신 → PipelineExecution 생성
     ↓
ReviewUseCase 실행 (Claude API 호출)
     - 코드 diff 분석
     - AI 리뷰 코멘트 생성
     - GitHub PR에 자동 댓글 등록
     ↓
ReviewCompleted 이벤트 발행
     ↓
TestRunUseCase 실행 (Playwright)
     ↓
TestRunCompleted 이벤트 발행
     ↓
NotifyUseCase 실행 (Slack 알림)
     ↓
DeployUseCase 실행 (조건부 GitHub Actions 트리거)
     ↓
파이프라인 COMPLETED 상태
```

### 확인 체크리스트

```
1. GitHub PR에 AI 리뷰 댓글 등록됨 ✅
2. Slack 채널에 리뷰 완료 알림 수신 ✅
3. GET /api/pipelines 에서 파이프라인 COMPLETED 상태 ✅
4. GET /api/pipelines/{id} 에서 steps, review, testRun 데이터 존재 ✅
5. GET /api/pipelines/stats 에서 통계 갱신 ✅
```

### 파이프라인 수동 확인 (Swagger)

```
# 1. 파이프라인 목록 조회
GET /api/pipelines

# 2. 상세 조회 (id는 목록에서 확인)
GET /api/pipelines/1

# 3. 응답 예시
{
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "steps": [
      {"stepType": "WEBHOOK", "status": "SUCCESS"},
      {"stepType": "REVIEW", "status": "SUCCESS"},
      {"stepType": "TEST", "status": "SUCCESS"},
      {"stepType": "NOTIFY", "status": "SUCCESS"},
      {"stepType": "DEPLOY", "status": "SKIPPED"}
    ],
    "review": {
      "highCount": 0,
      "mediumCount": 2,
      "lowCount": 5
    },
    "testRun": {
      "status": "PASSED",
      "totalTests": 10,
      "passed": 10,
      "failed": 0
    }
  }
}
```

---

## 자주 묻는 문제 해결

### Docker 빌드 중 멈춤
```powershell
# Gradle 캐시가 없어서 의존성 다운로드 중. 5-10분 기다리기.
# 네트워크 문제라면:
docker compose build --no-cache
```

### PostgreSQL 포트 충돌
```
Error: port 5432 already in use
```
```powershell
# 이미 실행 중인 PostgreSQL 확인
netstat -ano | findstr 5432
# 해당 PID 종료 또는 docker-compose.yml에서 포트 변경:
ports:
  - "5433:5432"  # 외부 포트를 5433으로
```

### Redis 포트 충돌
```powershell
netstat -ano | findstr 6379
# 마찬가지로 포트 변경:
ports:
  - "6380:6379"
```

### Flyway 마이그레이션 실패
```
FlywayValidateException
```
개발 환경에서 DB를 완전히 초기화하고 싶을 때:
```powershell
# ⚠️ 주의: 데이터 전부 삭제됨
docker compose down -v
docker compose up -d postgres redis
# 잠시 기다렸다가 (DB 초기화 완료 후)
docker compose up api
```

### Claude API 403 에러
```
로그: Claude API error 403
```
- `console.anthropic.com` → API Keys에서 키 활성화 상태 확인
- Billing에서 크레딧 잔액 확인 ($0이면 충전)
- `.env`에 키가 올바르게 입력됐는지 확인 (공백, 줄바꿈 없이)

### Webhook 400/403 에러
```
403 Forbidden on /webhook/github
```
- GitHub Webhook 설정의 `Secret`과 `.env`의 `WEBHOOK_SECRET`이 동일한지 확인
- ngrok이 실행 중인지 확인

### 컨테이너 재시작 없이 .env 변경 반영
```powershell
# .env 수정 후 서비스 재시작
docker compose up -d --force-recreate api
```

---

## 서비스 URL 전체 정리

| 서비스 | URL | 설명 |
|--------|-----|------|
| API 서버 | http://localhost:8080 | Spring Boot |
| Swagger UI | http://localhost:8080/swagger-ui.html | API 테스트 |
| Actuator | http://localhost:8080/actuator/health | 헬스체크 |
| Prometheus | http://localhost:9090 | 메트릭 수집 |
| Grafana | http://localhost:3001 | 대시보드 (admin/admin) |
| PostgreSQL | localhost:5432 | DB (codeai/codeai1234) |
| Redis | localhost:6379 | 캐시/큐 |

---

## 자주 쓰는 Docker 명령어

```powershell
# 전체 시작
docker compose up -d

# 로그 실시간 보기
docker compose logs -f api

# 특정 서비스만 재시작
docker compose restart api

# 전체 종료 (데이터 보존)
docker compose down

# 전체 종료 + 볼륨 삭제 (DB 초기화)
docker compose down -v

# 컨테이너 상태 확인
docker compose ps

# Redis CLI 접속
docker exec -it codeai-redis redis-cli

# PostgreSQL 접속
docker exec -it codeai-postgres psql -U codeai -d codeai
```
