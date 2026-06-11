# 코디(Code AI) — 트러블슈팅 기록

> 개발 과정에서 실제로 발생한 에러와 해결 방법을 기록합니다.  
> 면접 소재로도 활용 가능합니다.

---

## 1. Gradle 9.3.0 + Spring Dependency Management 호환성 오류

### 증상
```
java.lang.NoSuchMethodError: 
  LenientConfiguration.getArtifacts(Spec)
```
`./gradlew build` 실행 시 즉시 실패. 컴파일도 안 됨.

### 원인
Gradle 9.3.0이 `io.spring.dependency-management:1.1.4` 플러그인의 내부 API를 더 이상 지원하지 않음.  
Spring Boot 3.2.5가 의존하는 플러그인 버전 문제.

### 해결
`gradle/wrapper/gradle-wrapper.properties`에서 Gradle 버전 다운그레이드:
```properties
# Before
distributionUrl=https://services.gradle.org/distributions/gradle-9.3.0-bin.zip

# After
distributionUrl=https://services.gradle.org/distributions/gradle-8.12.1-bin.zip
```

### 교훈
Spring Boot 버전과 Gradle 버전 호환성을 반드시 확인.  
Spring Boot 3.2.x → Gradle 8.x 권장. [Spring 공식 호환성 표 참고](https://docs.spring.io/spring-boot/docs/current/reference/html/dependency-versions.html)

---

## 2. `flyway-database-postgresql` 의존성 없음

### 증상
```
Could not resolve com.flywaydb:flyway-database-postgresql:9.x.x
```

### 원인
`flyway-database-postgresql` artifact는 Flyway **10.x 이상**에서만 존재.  
Spring Boot 3.2.5가 자동으로 가져오는 Flyway 버전은 9.x.  
`build.gradle.kts`에 잘못 추가된 의존성이 충돌.

### 해결
`build.gradle.kts`에서 해당 의존성 제거. Flyway 9.x에서는 PostgreSQL 드라이버가 자동 감지됨.
```kotlin
// 제거
// implementation("org.flywaydb:flyway-database-postgresql")
```

### 교훈
Spring Boot 스타터가 자동으로 버전 관리하는 의존성에 대해 명시적 버전을 추가하면 충돌 발생.  
필요한 경우 `implementation("org.flywaydb:flyway-core")` 만 추가.

---

## 3. WebhookController 응답 타입 컴파일 오류

### 증상
```
Type mismatch: inferred type is ApiResponse<Nothing> 
  but ApiResponse<Map<String, Any>> was expected
```

### 원인
Kotlin 제네릭의 공변성 문제.  
`ApiResponse<Nothing>`은 `ApiResponse<Map<String, Any>>`의 하위 타입이 아님.

### 해결
반환 타입을 스타 프로젝션(`*`)으로 변경:
```kotlin
// Before
fun handleWebhook(...): ResponseEntity<ApiResponse<Map<String, Any>>>

// After
fun handleWebhook(...): ResponseEntity<ApiResponse<*>>
```

### 교훈
Kotlin에서 제네릭 공변성이 필요한 경우 `out T` 또는 `*` 스타 프로젝션 사용.  
`ApiResponse<Nothing>`은 "데이터 없는 성공 응답"을 표현하는 방법.

---

## 4. Docker Compose PostgreSQL과 Flyway 마이그레이션 충돌

### 증상
```
Table 'repositories' already exists
org.flywaydb.core.api.exception.FlywayValidateException
```
Docker로 서버 기동 시 Flyway가 이미 존재하는 테이블을 다시 생성하려 해서 실패.

### 원인
`docker-compose.yml`의 postgres 서비스에 초기화 SQL 파일을 마운트했는데,  
Flyway가 실행될 때 테이블이 이미 존재하는 상태였음.
```yaml
# 문제가 된 설정
volumes:
  - ./codeai-backend/src/main/resources/db/migration:/docker-entrypoint-initdb.d
```

### 해결
`docker-compose.yml`에서 마이그레이션 볼륨 마운트 제거.  
테이블 생성은 Flyway가 단독으로 처리하도록 일원화.
```yaml
# 제거
# volumes:
#   - ./..../migration:/docker-entrypoint-initdb.d
```

### 교훈
Flyway와 Docker init 스크립트를 동시에 사용하지 말 것.  
두 방법 중 하나만 선택. 이 프로젝트는 Flyway 단독 사용.

---

## 5. Spring WebFlux + JPA 블로킹 문제

### 증상
증상은 없지만, JPA 호출이 WebFlux 이벤트 루프 스레드에서 실행되면:
- 성능 저하 (이벤트 루프 블로킹)
- 경고 로그: `Blocking call in non-blocking context`

### 원인
Spring WebFlux는 Reactor Netty 이벤트 루프(Non-blocking) 기반.  
JPA는 JDBC 기반으로 본질적으로 Blocking.  
이벤트 루프 스레드에서 JPA를 직접 호출하면 전체 처리량 저하.

### 해결
모든 JPA 호출을 `withContext(Dispatchers.IO)`로 감싸서 IO 스레드 풀로 격리:
```kotlin
override suspend fun save(execution: PipelineExecution): PipelineExecution =
    withContext(Dispatchers.IO) {  // ← IO 스레드 풀로 전환
        jpa.save(PipelineExecutionEntity.from(execution)).toDomain()
    }
```

### 교훈
WebFlux + JPA 조합 시 반드시 IO 디스패처 격리 필요.  
궁극적인 해결책은 R2DBC (비동기 DB 드라이버) 사용이지만, 러닝커브가 높음.

---

## 6. Redis Stream Consumer Group 재시작 오류

### 증상
```
io.lettuce.core.RedisCommandExecutionException: 
  BUSYGROUP Consumer Group name already exists
```
서버 재시작 시 매번 발생. 첫 시작은 정상, 재시작부터 오류.

### 원인
`@PostConstruct`에서 Consumer Group을 생성하는데,  
서버 재시작 시 이미 Redis에 그룹이 존재해서 중복 생성 오류.

### 해결
`BUSYGROUP` 에러를 무시하도록 처리:
```kotlin
@PostConstruct
fun initialize() {
    redisTemplate.opsForStream<String, String>()
        .createGroup(STREAM_KEY, ReadOffset.from("0"), GROUP_NAME)
        .onErrorComplete { it.message?.contains("BUSYGROUP") == true }
        .subscribe()
}
```

### 교훈
Redis Consumer Group은 멱등성(idempotent)이 없음.  
재시작 내성을 위해 이미 존재하는 에러는 무시해야 함.

---

## 7. Claude API JSON 파싱 실패

### 증상
코드리뷰 결과가 파싱되지 않아 comments 배열이 항상 비어있음.

### 원인
Claude API가 JSON을 마크다운 코드블록으로 감싸서 응답하는 경우:
````
```json
[{"severity": "HIGH", ...}]
```
````
JSON 파서가 backtick을 처리하지 못함.

### 해결
응답에서 마크다운 코드블록 제거 전처리 추가:
```kotlin
val cleaned = response
    .removePrefix("```json")
    .removePrefix("```")
    .removeSuffix("```")
    .trim()
val parsed = objectMapper.readValue<List<ParsedComment>>(cleaned)
```

### 교훈
LLM API 응답은 항상 전처리가 필요.  
Claude는 특히 코드/JSON 출력 시 마크다운 래핑을 자주 사용함.  
프롬프트에 `"JSON만 응답하고 마크다운 코드블록 없이"` 명시해도 완전히 방지 불가.

---

## 8. `slack.webhook.url` 설정 없음 오류

### 증상
```
java.lang.IllegalStateException: 
  Could not resolve placeholder 'slack.webhook.url' in value "${slack.webhook.url}"
```

### 원인
`SlackWebhookClient`가 `@Value("\${slack.webhook.url}")`로 필수 값을 주입받는데,  
`.env`에 `SLACK_WEBHOOK_URL`이 없거나 `application.yml`에 기본값이 없었음.

### 해결
`application.yml`에 기본값 추가:
```yaml
slack:
  webhook:
    url: ${SLACK_WEBHOOK_URL:}  # 빈 문자열이 기본값
```
그리고 `SlackWebhookClient.send()`에서 빈 URL 체크:
```kotlin
if (webhookUrl.isBlank()) {
    log.warn("Slack webhook URL이 설정되지 않았습니다.")
    return false
}
```

---

## 9. `@Value` vs 환경변수 우선순위

### 배경
Spring Boot의 속성 우선순위:
```
1. 커맨드라인 인수 (--spring.prop=value)
2. 환경변수 (SPRING_PROP=value) ← .env가 여기 해당
3. application-{profile}.yml
4. application.yml
```

### 주의사항
`application.yml`의 `${DB_USER:codeai}` 형식:
- `DB_USER` 환경변수가 있으면 그 값 사용
- 없으면 `codeai` 기본값 사용

`.env` 파일은 Docker Compose가 읽어서 환경변수로 주입.  
직접 `java -jar` 실행 시에는 `.env`가 자동으로 로드되지 않음.

---

## 10. Kotlin suspend 함수와 Spring @Transactional 충돌

### 증상
`@Transactional`이 코루틴 컨텍스트에서 동작하지 않거나 경고 발생.

### 원인
Spring의 `@Transactional`은 AOP 프록시 기반.  
코루틴의 코드는 여러 스레드를 넘나들 수 있어서 전통적인 ThreadLocal 기반 트랜잭션이 제대로 동작하지 않음.

### 현재 대응
`withContext(Dispatchers.IO)` 블록 안에서 JPA 작업을 처리함으로써  
트랜잭션 범위를 IO 스레드 내로 제한.  
복잡한 다중 저장 로직은 `@Transactional`이 필요한 경우 `@Service` 메서드를 별도 non-suspend 함수로 분리 후 `withContext(IO)` 내에서 호출.

---

## 자주 발생하는 런타임 에러 빠른 참조

| 에러 메시지 | 원인 | 해결 |
|------------|------|------|
| `Connection refused: localhost:5432` | PostgreSQL 미실행 | `docker-compose up -d postgres` |
| `Connection refused: localhost:6379` | Redis 미실행 | `docker-compose up -d redis` |
| `401 Unauthorized` API 호출 | JWT 토큰 없거나 만료 | 로그인 후 토큰 재발급 |
| `403 Forbidden` Webhook | HMAC 서명 불일치 | `.env`의 `WEBHOOK_SECRET`이 GitHub 설정과 동일한지 확인 |
| `Flyway validate failed` | 마이그레이션 파일 변경 | 운영 DB라면 새 버전 파일 추가. 개발 DB라면 `docker-compose down -v`로 볼륨 삭제 후 재시작 |
| `Claude API 402/403` | API 키 오류 | `console.anthropic.com`에서 키 확인, 크레딧 충전 여부 확인 |
| `ClassCastException: PipelineListResponse` | Redis 캐시 역직렬화 실패 | `docker exec codeai-redis redis-cli FLUSHDB`로 캐시 초기화 |
