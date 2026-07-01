package com.codeai.plugin.spi

/**
 * 배포 제공자 SPI. (종합설계 §5-1, v0.9 D14/D17)
 *
 * V1 구현체: GitHub Actions(workflow_dispatch, PUSH형). ArgoCD/Jenkins(PULL형 GitOps)는 V2.
 *
 * 설계 메모(D17): push형은 "결과 리턴", pull형은 "fire-and-forget reconcile"이라 한 메서드로 충돌한다.
 *   → `deploy()`를 '트리거'로 좁히고(핸들 즉시 반환), 결과 추적을 `status()` 폴링으로 분리하면
 *      두 모델이 같은 계약에 들어온다. V1 은 PUSH 만 구현하고, status() 는 트리거 성공=DEPLOYED 로 단순화.
 *
 * 핵심 불변 규칙(`HIGH==0 && 테스트 PASSED → 배포`)은 DeployUseCase(도메인)에 남기고,
 * 본 SPI 는 "어떻게 배포를 트리거/추적하는가"만 추상화한다.
 */
interface DeployProvider {
    val id: String

    /** 실행 모델. PUSH(Actions/Jenkins) | PULL_GITOPS(ArgoCD). V1 은 PUSH. */
    val mode: DeployMode get() = DeployMode.PUSH

    /** 트리거: 두 모델 모두 "시작"만 하고 핸들을 즉시 반환(fire-and-forget 통일). */
    suspend fun deploy(req: DeployRequest): DeployHandle

    /**
     * 상태 조회(폴링): 핸들로 현재 상태를 묻는다 — 이래서 두 모델이 같은 계약을 가질 수 있다.
     * V1(PUSH) 기본 구현: 트리거 성공이면 DEPLOYED, 실패면 FAILED. (실제 GH Actions run 폴링은 V1.x)
     */
    suspend fun status(handle: DeployHandle): DeployStatus =
        if (handle.triggered) DeployStatus.DEPLOYED else DeployStatus.FAILED
}

enum class DeployMode { PUSH, PULL_GITOPS }

enum class DeployStatus { PENDING, RUNNING, DEPLOYED, FAILED, UNKNOWN }

data class DeployRequest(
    val repoFullName: String,
    val ref: String,
    val inputs: Map<String, String> = emptyMap()
)

data class DeployHandle(
    val id: String,
    val triggered: Boolean
)
