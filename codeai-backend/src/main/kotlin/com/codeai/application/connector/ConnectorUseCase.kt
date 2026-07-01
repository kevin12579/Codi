package com.codeai.application.connector

import com.codeai.domain.admin.UserActivityLog
import com.codeai.domain.admin.UserActivityLogRepository
import com.codeai.infrastructure.connector.ConnectorConfigService
import com.codeai.infrastructure.persistence.settings.SettingsStore
import com.codeai.infrastructure.slack.SlackWebhookClient
import com.codeai.plugin.registry.ProviderRegistry
import com.codeai.presentation.connector.AiTestResultDto
import com.codeai.presentation.connector.ConnectorCategoryDetailDto
import com.codeai.presentation.connector.ConnectorCategoryDto
import com.codeai.presentation.connector.ConnectorProviderDto
import com.codeai.presentation.connector.ConnectorUpdateResultDto
import com.codeai.presentation.connector.NotifyTestResultDto
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.LocalDateTime

/**
 * 커넥터(플러그인) 조회/저장/연결테스트. (IA문서 §4 Connectors, 종합설계 §8-2)
 *
 * - 활성 선택: system_settings(ai.engine/notify.channels/...) — ProviderRegistry 가 읽음.
 * - 시크릿: connectors 테이블에 AES-256 암호화 저장(ConnectorConfigService).
 *   AI 키는 엔진이 호출 시점에 복호화해 사용 → 재배포 없이 즉시 적용.
 *   Slack URL 은 기존 NotifyUseCase 호환을 위해 system_settings.slack.webhook.url 로도 미러링.
 */
@Service
class ConnectorUseCase(
    private val settings: SettingsStore,
    private val connectorConfig: ConnectorConfigService,
    private val registry: ProviderRegistry,
    private val slackWebhookClient: SlackWebhookClient,
    private val activityLogRepository: UserActivityLogRepository,
    @Value("\${claude.api.key:}") private val claudeKey: String,
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    // 카테고리별 지원 프로바이더 카탈로그 (id → 표시명). 순서가 응답 순서.
    private val catalog: Map<String, List<Pair<String, String>>> = linkedMapOf(
        "ai" to listOf("claude" to "Claude Haiku", "openai" to "GPT-4o", "gemini" to "Gemini Flash"),
        "notify" to listOf("slack" to "Slack", "discord" to "Discord"),
        "vcs" to listOf("github" to "GitHub"),
        "test" to listOf("playwright" to "Playwright"),
        "deploy" to listOf("github-actions" to "GitHub Actions"),
    )

    suspend fun getAll(): Map<String, ConnectorCategoryDto> =
        catalog.keys.associateWith { cat -> ConnectorCategoryDto(activeOf(cat), availableOf(cat)) }

    suspend fun getCategory(category: String): ConnectorCategoryDetailDto {
        requireKnownCategory(category)
        return ConnectorCategoryDetailDto(category, activeOf(category), availableOf(category))
    }

    suspend fun update(
        category: String,
        activeProviders: List<String>,
        config: Map<String, Map<String, String>>,
        callerEmail: String = "system",
    ): ConnectorUpdateResultDto {
        val known = knownIds(category)
        val active = activeProviders.firstOrNull()
            ?: throw IllegalArgumentException("activeProviders가 비어 있습니다.")
        if (active !in known) throw ConnectorNotSupportedException("지원하지 않는 플러그인입니다: $active")

        config.forEach { (providerId, cfg) ->
            if (providerId !in known) throw ConnectorNotSupportedException("지원하지 않는 플러그인입니다: $providerId")
            connectorConfig.saveConfig(category, providerId, isActive = providerId == active, config = cfg)
        }

        when (category) {
            "ai" -> settings.set(ProviderRegistry.KEY_AI_ENGINE, active)
            "notify" -> {
                settings.set(ProviderRegistry.KEY_NOTIFY_CHANNELS, active)
                // 채널별 webhook URL 저장 (v0.9: slack | discord). slack 은 기존 키도 미러링(하위호환).
                config[active]?.get("webhookUrl")?.let { url ->
                    settings.set("$active.webhook.url", url)
                    if (active == "slack") settings.set("slack.webhook.url", url)
                }
            }
            "test" -> settings.set(ProviderRegistry.KEY_TEST_RUNNER, active)
            "deploy" -> settings.set(ProviderRegistry.KEY_DEPLOY_PROVIDER, active)
            "vcs" -> { /* V1: GitHub 고정 */ }
        }
        log.info("커넥터 변경: category=$category, active=$active")
        runCatching {
            activityLogRepository.save(
                UserActivityLog(userId = null, email = callerEmail, action = "설정 변경", result = "성공")
            )
        }
        return ConnectorUpdateResultDto(category, active)
    }

    suspend fun testAi(): AiTestResultDto {
        val engine = registry.activeAiEngine()
        if (!configuredOf("ai", engine.id)) {
            throw ConnectorTestFailedException("${engine.id} API 키가 설정되지 않았습니다.")
        }
        val start = System.currentTimeMillis()
        val result = try {
            engine.review(SAMPLE_DIFF, "v3")
        } catch (e: Exception) {
            throw AiEngineException("AI 엔진 호출 실패: ${e.message}")
        }
        val latency = System.currentTimeMillis() - start
        val sample = result.comments.firstOrNull()?.content ?: "이슈가 발견되지 않았습니다. (정상 응답)"
        return AiTestResultDto(engine = engine.id, latencyMs = latency, sampleReview = sample)
    }

    suspend fun testNotify(): NotifyTestResultDto {
        val url = settings.get("slack.webhook.url")
        if (url.isNullOrBlank()) throw NotifyNotConfiguredException("Slack Webhook URL이 설정되지 않았습니다.")
        val sent = slackWebhookClient.send(mapOf("text" to "코디 커넥터 연결 테스트 메시지입니다. ✅"), url)
        if (!sent) throw ConnectorTestFailedException("Slack 발송 실패. Webhook URL을 확인하세요.")
        return NotifyTestResultDto(sent = true, channel = "slack", sentAt = LocalDateTime.now().toString())
    }

    /** vcs/test/deploy 는 V1 고정 — 단순 성공 응답. */
    suspend fun testStatic(category: String): Map<String, Any> {
        requireKnownCategory(category)
        return mapOf("ok" to true, "provider" to activeOf(category))
    }

    // ---- 내부 헬퍼 ----

    private fun requireKnownCategory(category: String) {
        if (!catalog.containsKey(category)) throw ConnectorNotSupportedException("지원하지 않는 카테고리: $category")
    }

    private fun knownIds(category: String): Set<String> =
        (catalog[category] ?: throw ConnectorNotSupportedException("지원하지 않는 카테고리: $category"))
            .map { it.first }.toSet()

    private suspend fun availableOf(category: String): List<ConnectorProviderDto> =
        catalog.getValue(category).map { (id, name) ->
            val configured = configuredOf(category, id)
            ConnectorProviderDto(id, name, configured, if (configured) keyHintOf(category, id) else null)
        }

    /** 설정된 키/URL을 복호화해 마스킹 힌트(앞 4자 + 점) 생성. URL은 도메인까지 노출. */
    private suspend fun keyHintOf(category: String, providerId: String): String? {
        val raw = when {
            category == "ai" && providerId == "claude" -> claudeKey.takeIf { it.isNotBlank() && it != "placeholder" }
            category == "ai" -> connectorConfig.getApiKey("ai", providerId)
            category == "notify" -> settings.get("$providerId.webhook.url")
            else -> null
        }?.takeIf { it.isNotBlank() } ?: return null

        return if (category == "notify") {
            // URL: 앞 28자 정도 + 점 (도메인 식별 가능)
            if (raw.length <= 28) raw else raw.take(28) + "···"
        } else {
            // 키: 앞 4자 + 점
            raw.take(4) + "········"
        }
    }

    private suspend fun activeOf(category: String): String = when (category) {
        "ai" -> settings.get(ProviderRegistry.KEY_AI_ENGINE) ?: ProviderRegistry.DEFAULT_AI
        "notify" -> settings.getList(ProviderRegistry.KEY_NOTIFY_CHANNELS).firstOrNull() ?: ProviderRegistry.DEFAULT_NOTIFY
        "test" -> settings.get(ProviderRegistry.KEY_TEST_RUNNER) ?: ProviderRegistry.DEFAULT_TEST
        "deploy" -> settings.get(ProviderRegistry.KEY_DEPLOY_PROVIDER) ?: ProviderRegistry.DEFAULT_DEPLOY
        "vcs" -> ProviderRegistry.DEFAULT_VCS
        else -> throw ConnectorNotSupportedException("지원하지 않는 카테고리: $category")
    }

    private suspend fun configuredOf(category: String, providerId: String): Boolean = when {
        category == "ai" && providerId == "claude" -> claudeKey.isNotBlank() && claudeKey != "placeholder"
        category == "ai" -> connectorConfig.isConfigured("ai", providerId) // openai / gemini
        category == "notify" && providerId == "slack" -> !settings.get("slack.webhook.url").isNullOrBlank()
        category == "notify" && providerId == "discord" -> !settings.get("discord.webhook.url").isNullOrBlank() // v0.9 V1-B 도전
        category == "notify" -> false
        else -> true // vcs / test / deploy: V1 환경설정 고정
    }

    companion object {
        private val SAMPLE_DIFF = """
            diff --git a/Sample.kt b/Sample.kt
            --- a/Sample.kt
            +++ b/Sample.kt
            @@ -0,0 +1,3 @@
            +fun divide(a: Int, b: Int): Int {
            +    return a / b
            +}
        """.trimIndent()
    }
}
