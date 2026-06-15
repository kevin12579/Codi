package com.codeai.presentation.webhook

import com.codeai.application.webhook.WebhookProcessUseCase
import com.codeai.presentation.common.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/webhook")
class WebhookController(
    private val hmacValidator: HmacValidator,
    private val webhookProcessUseCase: WebhookProcessUseCase
) {
    @PostMapping("/github")
    suspend fun receiveGithubWebhook(
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

        val executionId = webhookProcessUseCase.process(payload)
        return ResponseEntity.ok(
            ApiResponse.ok(
                mapOf<String, Any>("pipelineExecutionId" to executionId),
                "이벤트 수신 완료"
            )
        )
    }
}
