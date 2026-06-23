<div align="center">

# Codi

**AI-Powered PR Review & Deploy Pipeline**

GitHub PR이 열리면 AI 코드리뷰 + E2E 테스트를 자동 실행하고,  
결과를 Slack으로 알림한 뒤 조건 충족 시 자동 배포까지 이어주는 개발 워크플로우 자동화 플랫폼.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9-blue?logo=kotlin)](https://kotlinlang.org)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-green?logo=spring)](https://spring.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)

</div>

---

## What is Codi?

Codi는 PR 한 번으로 코드리뷰 · 테스트 · 배포를 자동화하는 오픈소스 플랫폼이다.

- **AI 코드리뷰** — Claude / GPT-4o / Gemini 중 하나를 골라 PR diff를 분석하고 심각도별 이슈를 PR 댓글로 등록
- **자동 E2E 테스트** — Playwright 전용 컨테이너를 파이프라인에서 직접 호출
- **조건부 배포** — HIGH 이슈 0건 + 테스트 통과 시에만 GitHub Actions 배포 트리거
- **Slack 알림** — 리뷰 완료 · 테스트 결과 · 배포 성공을 단계별로 발송
- **MCP 서버** — Claude Desktop · Cursor에서 직접 도구 호출 가능
- **런타임 엔진 교체** — 재배포 없이 대시보드에서 AI 엔진 / 알림 채널 / 배포 제공자를 즉시 전환

---

## How It Works

```
GitHub PR 오픈
  │
  ▼  POST /webhook/github  (HMAC-SHA256 검증)
  │
  ├── AI 코드리뷰  → PR 댓글 등록 → Slack 알림
  │
  └── Playwright E2E  → 결과 기록 → Slack 알림
  │
  ▼  HIGH 이슈 0건 + 테스트 통과?
     → GitHub Actions workflow_dispatch 트리거
```

---

## Tech Stack

| | |
|---|---|
| **Backend** | Kotlin · Spring Boot WebFlux · Coroutines |
| **Frontend** | React 18 · Vite · TailwindCSS |
| **Database** | PostgreSQL · Redis (Stream / Cache) |
| **AI** | Claude (Haiku) · GPT-4o Mini · Gemini 2.0 Flash |
| **Testing** | Playwright (전용 Node.js 컨테이너) |
| **MCP** | Spring AI 1.0.9 (SSE 전송) |
| **Infra** | Docker Compose · GitHub Actions · Prometheus + Grafana |

---

## Quick Start

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env`에서 필수 항목 입력:

```env
WEBHOOK_SECRET=your_github_webhook_secret
JWT_SECRET=your_jwt_secret_256bit
AES_SECRET_KEY=your_32byte_hex_key

# AI 엔진 (1개 이상)
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# 알림 / VCS
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
GITHUB_TOKEN=ghp_...
```

### 2. 실행

```bash
docker compose up -d
```

### 3. GitHub Webhook 등록

| 항목 | 값 |
|------|-----|
| Payload URL | `https://{서버주소}/webhook/github` |
| Content type | `application/json` |
| Secret | `.env`의 `WEBHOOK_SECRET` |
| Events | `Pull requests` |

### 4. 대시보드 접속

```
http://localhost:3000
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## Environment Variables

| 변수 | 필수 | 설명 |
|------|------|------|
| `WEBHOOK_SECRET` | ✅ | GitHub Webhook HMAC 서명 키 |
| `JWT_SECRET` | ✅ | JWT 서명 키 (256비트 이상) |
| `AES_SECRET_KEY` | ✅ | 커넥터 API 키 암호화 키 (32바이트 hex) |
| `CLAUDE_API_KEY` | — | Anthropic API 키 |
| `CLAUDE_MODEL` | — | 기본값: `claude-haiku-4-5-20251001` |
| `OPENAI_API_KEY` | — | OpenAI API 키 |
| `OPENAI_MODEL` | — | 기본값: `gpt-4o-mini` |
| `GEMINI_API_KEY` | — | Google Gemini API 키 |
| `SLACK_WEBHOOK_URL` | — | Slack Incoming Webhook URL |
| `GITHUB_TOKEN` | — | PR 댓글 작성용 토큰 |
| `PLAYWRIGHT_ENABLED` | — | `true` 시 실제 E2E 테스트 실행 (기본값: `false`) |
| `CODEAI_API_KEY` | — | MCP 엔드포인트 인증 키 (`X-Api-Key`) |

---

## Extending Codi

Codi는 5개 SPI 인터페이스로 모든 외부 연동을 추상화한다.  
새 구현체를 Spring Bean으로 등록하면 대시보드에서 즉시 선택할 수 있다.

### 새 AI 엔진 추가

```kotlin
@Component
class MyAiEngine : AIReviewEngine {
    override val id = "my-engine"
    override val preferredPromptVersion = "v4"

    override suspend fun review(diff: String, promptVersion: String): ReviewResult {
        // AI API 호출 후 ReviewResult 반환
    }
}
```

등록 후 `PUT /api/connectors/ai` → `{ "activeProviders": ["my-engine"] }` 로 즉시 전환.

### 새 알림 채널 추가

```kotlin
@Component
class DiscordChannel : NotificationChannel {
    override val id = "discord"

    override suspend fun send(message: String, webhookUrl: String): Boolean { ... }
}
```

### 확장 가능한 SPI 목록

| SPI | V1 구현체 | 확장 예시 |
|-----|-----------|---------|
| `AIReviewEngine` | Claude · GPT-4o · Gemini | Ollama (로컬 LLM) |
| `VCSProvider` | GitHub | GitLab · Bitbucket |
| `NotificationChannel` | Slack | Discord · Teams |
| `TestRunner` | Playwright | Cypress |
| `DeployProvider` | GitHub Actions | Jenkins · ArgoCD |

---

## MCP Integration

Claude Desktop · Cursor에서 Codi의 도구를 직접 호출할 수 있다.

`claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "codi": {
      "url": "http://localhost:8080/sse",
      "headers": { "X-Api-Key": "<CODEAI_API_KEY>" }
    }
  }
}
```

사용 가능한 도구: `get_pr_diff` · `post_review_comment` · `run_e2e_tests` · `trigger_deploy` · `send_notification` · `mask_secrets`

---

## License

[MIT](LICENSE) © 2026 Team Codi
