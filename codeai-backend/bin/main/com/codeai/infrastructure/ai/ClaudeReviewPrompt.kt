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

        리뷰 기준:
        - 보안 취약점 (SQL Injection, XSS, 인증/인가 누락)
        - Kotlin null-safety (NPE 가능성, !! 연산자 남용)
        - 성능 이슈 (N+1 쿼리, 불필요한 블로킹 호출)
        - 코드 품질 (중복 코드, 단일 책임 원칙 위반)

        응답 형식 (반드시 JSON만 반환, 마크다운 코드블록 없이):
        {"issues": [{"severity": "HIGH|MEDIUM|LOW", "filePath": "파일 경로", "lineNumber": 줄번호 또는 null, "content": "이슈 설명", "suggestion": "수정 예시 또는 null"}]}

        이슈가 없으면: {"issues": []}

        코드 diff:
        $diff
    """.trimIndent()
}
