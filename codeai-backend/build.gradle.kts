import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.4.5"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    kotlin("plugin.jpa") version "1.9.25"
}

group = "com.codeai"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

// Spring AI 1.0.x — Spring Boot 3.4.x (Framework 6.2.x) 호환 GA 릴리스.
// 2.0.0-M6 은 HttpHeaders.asMultiValueMap() (Framework 7.x) 를 호출하므로 Boot 3.x 에서 동작 불가.
// 1.0.x 의 MCP 전송: SSE (/sse 엔드포인트, WebFluxSseServerTransportProvider).
extra["springAiVersion"] = "1.0.9"

dependencyManagement {
    imports {
        mavenBom("org.springframework.ai:spring-ai-bom:${property("springAiVersion")}")
    }
}


dependencies {
    // Spring Boot WebFlux (비동기 Reactive)
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Spring AI MCP Server (SSE 전송, WebFlux) — V1 신규
    // spring-ai 1.0.x: WebFluxSseServerTransportProvider → /sse 엔드포인트
    implementation("org.springframework.ai:spring-ai-starter-mcp-server-webflux")

    // Spring Data JPA + PostgreSQL
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("org.postgresql:postgresql")

    // Spring Data Redis (Stream + Cache)
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Flyway (DB 마이그레이션)
    // Flyway 10.x 부터 PostgreSQL 지원이 flyway-core에서 분리됨
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Swagger / OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.8.6")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // Actuator + Prometheus
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += "-Xjsr305=strict"
        jvmTarget = "21"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
