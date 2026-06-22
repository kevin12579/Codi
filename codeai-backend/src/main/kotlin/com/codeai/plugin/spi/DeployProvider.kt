package com.codeai.plugin.spi

/**
 * 배포 제공자 SPI. (종합설계 §5-1)
 *
 * V1 구현체: GitHub Actions(workflow_dispatch). ArgoCD/Jenkins 등은 V2.
 *
 * 핵심 불변 규칙(`HIGH==0 && 테스트 PASSED → 배포`)은 DeployUseCase(도메인) 에 남기고,
 * 본 SPI 는 "어떻게 배포를 트리거하는가"만 추상화한다.
 */
interface DeployProvider {
    val id: String
    suspend fun deploy(repoFullName: String, ref: String, inputs: Map<String, String>): Boolean
}
