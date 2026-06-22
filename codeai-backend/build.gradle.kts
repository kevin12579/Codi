import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.23"
    kotlin("plugin.spring") version "1.9.23"
    kotlin("plugin.jpa") version "1.9.23"
}

group = "com.codeai"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
    // Spring AI MCP (마일스톤 릴리스 — GA 아님)
    maven { url = uri("https://repo.spring.io/milestone") }
}

// Spring AI BOM (MCP 스타터 버전 정렬)
extra["springAiVersion"] = "2.0.0-M6"

dependencyManagement {
    imports {
        mavenBom("org.springframework.ai:spring-ai-bom:${property("springAiVersion")}")
    }
}


dependencies {
    // Spring Boot WebFlux (비동기 Reactive)
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Spring AI MCP Server (Streamable HTTP, WebFlux) — V1 신규
    implementation("org.springframework.ai:spring-ai-starter-mcp-server-webflux")
    // MCP 의 Jackson 3 매퍼(tools.jackson)는 jackson-annotations 2.21 의 JsonSerializeAs 가 필요.
    // Spring Boot 3.2.5 BOM 은 2.15.4 로 고정하므로 명시적 버전으로 덮어쓴다.
    // (jackson-databind 는 2.15.4 유지 → 기존 앱 Jackson2 동작 불변, annotations 는 상위호환)
    implementation("com.fasterxml.jackson.core:jackson-annotations:2.21")

    // Spring Data JPA + PostgreSQL
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("org.postgresql:postgresql")

    // Spring Data Redis (Stream + Cache)
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Flyway (DB 마이그레이션)
    implementation("org.flywaydb:flyway-core")

    // Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Swagger / OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.3.0")

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
