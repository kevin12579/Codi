package com.codeai.plugin.spi

/**
 * VCS(버전 관리 시스템) 플랫폼 SPI. (종합설계 §5-1)
 *
 * V1 구현체: GitHub(레퍼런스 1종). GitLab/Bitbucket 등은 V2.
 *
 * Phase 1 범위: 파이프라인 실행 중 사용하는 VCS 읽기/쓰기(diff 조회·PR 코멘트 등록)만 추상화한다.
 * Webhook 서명검증(HmacValidator)·이벤트 파싱(WebhookProcessUseCase)은
 * 인입 경로에 깊게 얽혀 회귀 위험이 크므로 P1에서는 추상화 대상에서 제외(추후 과제).
 */
interface VCSProvider {
    val id: String
    suspend fun getDiff(repoFullName: String, prNumber: Int): String
    suspend fun postReviewComment(repoFullName: String, prNumber: Int, body: String): Long?
}
