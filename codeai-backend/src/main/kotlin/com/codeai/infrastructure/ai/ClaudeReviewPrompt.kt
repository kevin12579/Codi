package com.codeai.infrastructure.ai

object ClaudeReviewPrompt {

    fun build(diff: String, version: String): String = when (version) {
        "v1" -> buildV1(diff)
        "v2" -> buildV2(diff)
        "v3" -> buildV3(diff)
        else -> buildV4(diff)
    }

    private fun buildV1(diff: String) = """
        이 코드를 리뷰해줘:
        $diff
    """.trimIndent()

    private fun buildV2(diff: String) = """
        Kotlin Spring Boot 코드입니다.
        보안 취약점, null-safety, 성능 이슈 중심으로 리뷰해주세요.
        JSON 형식으로: {"issues": [{"severity": "HIGH|MEDIUM|LOW", "filePath": "...", "lineNumber": null, "content": "...", "suggestion": null}]}

        코드:
        $diff
    """.trimIndent()

    private fun buildV3(diff: String) = """
        당신은 Kotlin + Spring Boot 전문 시니어 개발자입니다.
        아래 PR diff를 분석해 코드리뷰를 JSON 형식으로 작성해주세요.

        [분석 제외 규칙 — 반드시 준수]
        - bin/, build/, out/, target/ 경로의 파일은 컴파일 산출물이므로 완전히 무시하세요.
        - diff의 "-"(삭제) 라인은 분석하지 마세요. "+"(추가) 라인만 분석하세요.

        [오탐 방지 규칙 — HIGH 분류 전 반드시 확인]
        - data class, domain 모델, entity의 필드 선언(val password: String 등)만 보고 "평문 저장"으로 판단하지 마세요.
          같은 diff 안에 실제 평문 저장 코드(passwordEncoder 미사용)가 명확히 보여야만 HIGH입니다.
        - application.yml, .env.example의 빈 문자열 기본값(예: url: "")은 보안 취약점이 아닙니다. 무시하세요.
        - 설정값(webhook secret, API key)이 DB에 저장되는 패턴 자체는 HIGH가 아닙니다.
          평문 하드코딩(소스코드에 실제 값 직접 삽입)만 HIGH로 분류하세요.
        - diff가 전체 파일이 아닌 일부 청크일 수 있습니다. 보이지 않는 코드에 대해 가정하지 마세요.

        [심각도 기준 — 엄격히 적용]
        - HIGH: 실제 보안 취약점만 해당 (인증 우회, SQL Injection, 비밀번호 평문 저장, 민감 정보 소스코드 하드코딩).
                성능 문제, 코드 스타일, 리팩토링 제안은 HIGH가 아닙니다.
        - MEDIUM: 기능 버그 가능성 (NPE, 에러 처리 누락, 경쟁 조건), N+1 쿼리 등 성능 이슈
        - LOW: 코드 가독성, 중복, 네이밍, 경미한 리팩토링

        [리뷰 기준]
        - 보안 취약점 (인증/인가 누락, 민감 정보 노출)
        - Kotlin null-safety (NPE 가능성, !! 남용)
        - 에러 처리 누락
        - 성능 이슈 (N+1 쿼리, 블로킹 호출)

        응답 형식 (반드시 JSON만 반환, 마크다운 코드블록 없이):
        {"issues": [{"severity": "HIGH|MEDIUM|LOW", "filePath": "파일 경로", "lineNumber": 줄번호 또는 null, "content": "이슈 설명 (2문장 이내)", "suggestion": "수정 방향 1문장"}]}

        이슈가 없으면: {"issues": []}

        코드 diff:
        $diff
    """.trimIndent()

    // v4: GPT/Gemini 계열 엔진용 — HIGH 오탐 방지는 유지하되 LOW 적극 보고 허용.
    // v3의 "보이지 않는 코드에 대해 가정하지 마세요" 제거 → GPT-4o-mini 과억제 방지.
    private fun buildV4(diff: String) = """
        당신은 Kotlin + Spring Boot 전문 시니어 개발자입니다.
        아래 PR diff를 꼼꼼히 분석해 코드리뷰를 JSON 형식으로 작성해주세요.
        실제 이슈가 있다면 반드시 보고하세요. 이슈가 전혀 없는 경우에만 빈 배열을 반환하세요.

        [분석 제외 규칙]
        - bin/, build/, out/, target/ 경로의 파일은 완전히 무시하세요.
        - diff의 "-"(삭제) 라인은 분석하지 마세요. "+"(추가) 라인만 분석하세요.

        [HIGH 오탐 방지 — HIGH 분류 전 반드시 확인]
        - data class, domain 모델, entity의 필드 선언(val password: String 등)만으로 "평문 저장"으로 판단하지 마세요.
          실제 평문 저장 코드(passwordEncoder 미사용)가 명확히 보여야만 HIGH입니다.
        - application.yml, .env.example의 빈 문자열 기본값은 보안 취약점이 아닙니다.
        - 소스코드에 실제 값이 직접 하드코딩된 경우만 HIGH로 분류하세요.

        [심각도 기준]
        - HIGH: 실제 보안 취약점 (인증 우회, SQL Injection, 비밀번호 평문 저장, 하드코딩된 시크릿)
        - MEDIUM: 기능 버그 가능성 (NPE, 에러 처리 누락, N+1 쿼리, 경쟁 조건)
        - LOW: 코드 가독성, 네이밍, 중복, 리팩토링 제안 — 개선 여지가 있다면 사소한 것도 보고하세요.

        [리뷰 기준 — 아래 항목을 적극적으로 확인]
        - Kotlin null-safety: !! 연산자, 안전하지 않은 캐스팅, NPE 가능성
        - 에러 처리: catch 블록이 비어 있거나 예외를 삼키는 경우
        - 성능: N+1 쿼리 패턴, 불필요한 블로킹 호출
        - 코드 품질: 함수/변수 네이밍, 중복 로직, 불필요한 복잡성

        응답 형식 (반드시 JSON만 반환, 마크다운 코드블록 없이):
        {"issues": [{"severity": "HIGH|MEDIUM|LOW", "filePath": "파일 경로", "lineNumber": 줄번호 또는 null, "content": "이슈 설명 (2문장 이내)", "suggestion": "수정 방향 1문장"}]}

        이슈가 전혀 없으면: {"issues": []}

        코드 diff:
        $diff
    """.trimIndent()
}
