# 코디(Code AI) — 프론트엔드 팀 협업 가이드

> 백엔드 API가 완성된 상태에서 프론트엔드 팀과 어떻게 협업하는지 단계별로 설명합니다.

---

## 1. API 명세 공유 방법

### 1-1. Swagger UI (가장 빠른 방법)

서버 실행 후 아래 URL에서 모든 API를 시각적으로 확인하고 직접 테스트할 수 있습니다.

```
http://localhost:8080/swagger-ui.html
```

**프론트 팀에게 공유하는 방법:**
1. 서버 실행: `docker-compose up`
2. 브라우저에서 위 URL 접속
3. 필요시 ngrok으로 외부 URL 발급해서 공유 (아래 참조)

**Swagger에서 확인 가능한 정보:**
- 모든 API 엔드포인트 (GET/POST/PUT/DELETE)
- 요청 파라미터 및 Body 스키마
- 응답 스키마 (ApiResponse 래퍼 포함)
- JWT 인증이 필요한 API (자물쇠 아이콘)

### 1-2. Swagger에서 JWT 인증 테스트하기

```
1. POST /api/auth/login 호출 → token 값 복사
2. Swagger 우상단 [Authorize] 버튼 클릭
3. "Bearer {복사한토큰}" 입력 (Bearer 뒤에 공백 포함)
4. 이제 인증이 필요한 API도 테스트 가능
```

### 1-3. OpenAPI JSON 다운로드

```
http://localhost:8080/api-docs
```
이 URL에서 JSON 형태의 API 명세를 다운받아 Postman에 임포트하거나 프론트 팀에 공유할 수 있습니다.

---

## 2. 공통 응답 형식

**모든 API 응답은 아래 형식을 따릅니다.** 프론트 팀이 반드시 알아야 할 내용입니다.

```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지",
  "error": null
}
```

**에러 응답:**
```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "에러 메시지"
}
```

**HTTP 상태코드 규칙:**
| 코드 | 상황 |
|------|------|
| 200 | 성공 (GET, PUT) |
| 201 | 생성 성공 (POST) |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | JWT 없음 또는 만료 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 내부 오류 |

---

## 3. 인증 플로우

프론트 팀이 구현해야 하는 인증 흐름:

```
1. POST /api/auth/register  (회원가입)
   Body: { "email": "...", "password": "...", "name": "..." }
   
2. POST /api/auth/login  (로그인)
   Body: { "email": "...", "password": "..." }
   Response: { "data": { "token": "eyJ...", "expiresIn": 86400 } }
   
3. 이후 모든 요청 헤더에 추가:
   Authorization: Bearer {token}

4. POST /api/auth/logout  (로그아웃)
   - 서버 측에서는 아무것도 하지 않음 (stateless JWT)
   - 프론트에서 localStorage/sessionStorage의 토큰을 직접 삭제
```

**토큰 만료 처리:**
```javascript
// 예시: Axios 인터셉터로 401 처리
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

## 4. 주요 API 목록

### 인증
| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| POST | /api/auth/register | 회원가입 | X |
| POST | /api/auth/login | 로그인 | X |
| POST | /api/auth/logout | 로그아웃 | O |

### 파이프라인
| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | /api/pipelines | 목록 조회 (페이징, 필터) | O |
| GET | /api/pipelines/{id} | 상세 조회 | O |
| GET | /api/pipelines/stats | 통계 | O |

파이프라인 목록 쿼리 파라미터:
```
?status=RUNNING&from=2025-01-01&to=2025-12-31&page=0&size=20
```

### 설정
| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | /api/settings | 전체 설정 조회 | O |
| GET | /api/settings/slack | Slack 설정 | O |
| PUT | /api/settings/slack | Slack URL 업데이트 | O |
| POST | /api/settings/slack/test | Slack 테스트 발송 | O |
| GET | /api/settings/claude | Claude 설정 | O |
| PUT | /api/settings/claude | Claude 설정 업데이트 | O |
| GET | /api/settings/github | GitHub 설정 | O |
| PUT | /api/settings/github | GitHub Webhook Secret 업데이트 | O |

---

## 5. CORS 설정

현재 `WebConfig.kt`에서 CORS가 설정되어 있습니다.

**개발 중 (로컬):**
```
허용 Origin: http://localhost:3000, http://localhost:5173 (Vite 기본 포트)
허용 Method: GET, POST, PUT, DELETE, OPTIONS
허용 Header: *, Authorization
```

**프론트 팀이 다른 포트를 쓰는 경우:**
백엔드 팀에 포트 번호 알려주세요. `WebConfig.kt`에 추가합니다.

```kotlin
// src/main/kotlin/com/codeai/infrastructure/config/WebConfig.kt
registry.addMapping("/**")
    .allowedOrigins(
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:NEW_PORT"  // ← 추가
    )
```

---

## 6. Postman 컬렉션 설정 가이드

Swagger URL에서 Postman으로 가져오는 방법:

```
1. Postman 실행
2. Import 버튼 클릭
3. "Link" 탭에서 URL 입력:
   http://localhost:8080/api-docs
4. Import 완료 → 모든 API 자동 생성
```

**Postman 환경 변수 설정:**
```
Variable: BASE_URL   Value: http://localhost:8080
Variable: TOKEN      Value: (로그인 후 복사)
```

---

## 7. 실시간 협업 시나리오

### 시나리오 A: 기능 개발 중 백엔드 API 검증

```
1. 백엔드 서버 실행 확인 (localhost:8080)
2. Swagger에서 새 API 테스트
3. 응답 형식 확인 후 프론트 코드 작성
4. 문제 발생 시 Slack/메신저로 공유할 curl 명령어:

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### 시나리오 B: ngrok으로 로컬 서버 외부 공유

백엔드가 로컬에서만 실행 중일 때, 프론트 팀과 함께 테스트하려면:

```bash
# ngrok 설치 후
ngrok http 8080

# 출력 예시:
Forwarding  https://abc123.ngrok.io -> http://localhost:8080

# 이 URL을 프론트 팀에게 공유
# Swagger: https://abc123.ngrok.io/swagger-ui.html
```

**주의:** ngrok 무료 버전은 세션마다 URL이 바뀜. 테스트 완료 후 새 URL 공유 필요.

### 시나리오 C: Webhook 실제 테스트

GitHub에서 실제 PR이 생성될 때 백엔드가 처리하는 흐름을 테스트하려면 ngrok이 필수입니다.

```
1. ngrok http 8080 실행
2. https://abc123.ngrok.io/webhook/github 를 GitHub Repository Webhook URL로 설정
3. GitHub에서 PR 생성 → 자동으로 파이프라인 시작
4. GET /api/pipelines 로 결과 확인
```

---

## 8. 개발 단계별 협업 체크리스트

### 1단계: API 계약 확정
- [ ] Swagger UI 공유 및 검토
- [ ] 응답 형식 합의 (`ApiResponse<T>` 구조)
- [ ] 에러 코드 목록 공유
- [ ] 페이징 파라미터 합의 (page, size)

### 2단계: 병렬 개발
- [ ] Mock 서버 또는 실제 백엔드 서버 연결
- [ ] CORS 포트 확인 및 설정
- [ ] JWT 토큰 관리 방법 합의

### 3단계: 통합 테스트
- [ ] 로컬 환경에서 통합 테스트
- [ ] ngrok으로 Webhook 흐름 테스트
- [ ] 에러 케이스 테스트 (401, 404, 500)

### 4단계: 배포 후 테스트
- [ ] 실제 서버 URL로 변경
- [ ] 실제 GitHub Webhook 연동 확인
- [ ] Slack 알림 수신 확인

---

## 9. 자주 묻는 질문 (프론트 팀용)

**Q: 토큰 만료 시간은?**  
A: 기본 24시간 (`jwtExpiration: 86400000` ms). 만료 시 401 응답.

**Q: 파이프라인 상태값은 어떤 게 있어?**  
A: `PENDING`, `RUNNING`, `REVIEW_COMPLETED`, `TEST_COMPLETED`, `COMPLETED`, `FAILED`

**Q: 날짜 형식은?**  
A: ISO 8601 (`2025-06-11T12:00:00`) 사용. 타임존은 서버 기준 UTC+9 (한국).

**Q: 페이지네이션 응답 형식은?**  
```json
{
  "data": {
    "content": [...],
    "totalPages": 5,
    "totalElements": 100,
    "page": 0,
    "size": 20
  }
}
```

**Q: 파일 업로드 API는?**  
A: 현재 없음. 코드는 GitHub webhook을 통해서만 수신.

**Q: WebSocket/SSE 지원해?**  
A: 현재 없음. 파이프라인 상태는 폴링(polling) 방식으로 구현 권장.  
추후 Server-Sent Events 추가 예정.
