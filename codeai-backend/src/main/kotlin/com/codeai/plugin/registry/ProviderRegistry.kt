package com.codeai.plugin.registry

import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.plugin.spi.AIReviewEngine
import com.codeai.plugin.spi.DeployProvider
import com.codeai.plugin.spi.NotificationChannel
import com.codeai.plugin.spi.TestRunner
import com.codeai.plugin.spi.VCSProvider
import org.springframework.stereotype.Component

/**
 * 플러그인 레지스트리 — 카테고리별 활성 프로바이더를 런타임에 선택한다. (종합설계 §5-2)
 *
 * Spring 이 각 SPI 구현체 빈을 List 로 주입한다(현재 카테고리당 1종, AI 는 P4에서 3종).
 * 활성값은 system_settings 에서 읽되, 키가 없으면 V1 기본값으로 폴백한다.
 *   → P2 에서 system_settings 에 `ai.engine` 등을 시드하면 추가 변경 없이 동적 전환된다.
 *
 * 핵심 불변: "HIGH==0 && 테스트 PASSED → 배포" 규칙은 어떤 구현체로 교체해도 바뀌지 않는다.
 */
@Component
class ProviderRegistry(
    vcsProviders: List<VCSProvider>,
    aiEngines: List<AIReviewEngine>,
    channels: List<NotificationChannel>,
    runners: List<TestRunner>,
    deployers: List<DeployProvider>,
    private val settings: SettingsStore,
) {
    private val vcsById = vcsProviders.associateBy { it.id }
    private val aiById = aiEngines.associateBy { it.id }
    private val channelById = channels.associateBy { it.id }
    private val runnerById = runners.associateBy { it.id }
    private val deployById = deployers.associateBy { it.id }

    /** V1 은 VCS 가 GitHub 고정. */
    fun resolveVcs(): VCSProvider =
        requireNotNull(vcsById[DEFAULT_VCS]) { "VCSProvider '$DEFAULT_VCS' 미등록" }

    suspend fun activeAiEngine(): AIReviewEngine {
        val id = settings.get(KEY_AI_ENGINE) ?: DEFAULT_AI
        return aiById[id] ?: requireNotNull(aiById[DEFAULT_AI]) { "AIReviewEngine '$DEFAULT_AI' 미등록" }
    }

    /** 활성화된 알림 채널 전부 (V1: Slack 1개). */
    suspend fun activeChannels(): List<NotificationChannel> {
        val ids = settings.getList(KEY_NOTIFY_CHANNELS).ifEmpty { listOf(DEFAULT_NOTIFY) }
        return ids.mapNotNull { channelById[it] }
    }

    suspend fun activeRunner(): TestRunner {
        val id = settings.get(KEY_TEST_RUNNER) ?: DEFAULT_TEST
        return runnerById[id] ?: requireNotNull(runnerById[DEFAULT_TEST]) { "TestRunner '$DEFAULT_TEST' 미등록" }
    }

    suspend fun activeDeployer(): DeployProvider {
        val id = settings.get(KEY_DEPLOY_PROVIDER) ?: DEFAULT_DEPLOY
        return deployById[id] ?: requireNotNull(deployById[DEFAULT_DEPLOY]) { "DeployProvider '$DEFAULT_DEPLOY' 미등록" }
    }

    companion object {
        const val KEY_AI_ENGINE = "ai.engine"
        const val KEY_NOTIFY_CHANNELS = "notify.channels"
        const val KEY_TEST_RUNNER = "test.runner"
        const val KEY_DEPLOY_PROVIDER = "deploy.provider"

        const val DEFAULT_VCS = "github"
        const val DEFAULT_AI = "claude"
        const val DEFAULT_NOTIFY = "slack"
        const val DEFAULT_TEST = "playwright"
        const val DEFAULT_DEPLOY = "github-actions"
    }
}
