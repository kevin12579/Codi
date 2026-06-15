package com.codeai.infrastructure.ai

object ClaudeReviewPrompt {

    fun build(diff: String, version: String): String = when (version) {
        "v1" -> buildV1(diff)
        "v2" -> buildV2(diff)
        else -> buildV3(diff)
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
}
