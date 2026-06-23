package com.codeai.presentation.webhook

import com.codeai.application.webhook.WebhookProcessUseCase
import com.codeai.presentation.common.ApiResponse
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/webhook")
class WebhookController(
    private val hmacValidator: HmacValidator,
    private val webhookProcessUseCase: WebhookProcessUseCase,
    private val objectMapper: ObjectMapper
) {
    // POST /webhook/{provider} (변경종합 §4-4, 하위호환). V1 은 provider=github 고정 처리.
    // 기존 /webhook/github 도 {provider}=github 로 매칭되어 동작 동일.
    @PostMapping("/{provider}")
    suspend fun receiveWebhook(
        @PathVariable provider: String,
        @RequestHeader("X-Hub-Signature-256", required = false) signature: String?,
        @RequestHeader("X-GitHub-Event", required = false) eventType: String?,
        @RequestBody payload: String
    ): ResponseEntity<ApiResponse<*>> {
        if (signature == null || !hmacValidator.validate(payload, signature)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.fail("WEBHOOK_SIGNATURE_INVALID", "서명 검증 실패"))
        }

        if (eventType != "pull_request") {
            return ResponseEntity.ok(
                ApiResponse.ok(mapOf<String, Any>("message" to "ignored"), "지원하지 않는 이벤트 타입")
            )
        }

        // opened: PR 신규 생성, synchronize: PR 브랜치에 새 커밋 push만 처리
        // closed(merge), labeled, assigned 등은 무시
        val action = try {
            objectMapper.readTree(payload).get("action")?.asText() ?: ""
        } catch (e: Exception) { "" }

        if (action !in setOf("opened", "synchronize", "reopened")) {
            return ResponseEntity.ok(
                ApiResponse.ok(mapOf<String, Any>("message" to "ignored", "action" to action), "처리 대상 아님 (action=$action)")
            )
        }

        val executionId = webhookProcessUseCase.process(payload)
        return ResponseEntity.ok(
            ApiResponse.ok(
                mapOf<String, Any>("pipelineExecutionId" to executionId),
                "이벤트 수신 완료"
            )
        )
    }
}
