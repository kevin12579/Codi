package com.codeai.presentation.common

import com.codeai.application.connector.AiEngineException
import com.codeai.application.connector.ConnectorNotSupportedException
import com.codeai.application.connector.ConnectorTestFailedException
import com.codeai.application.connector.EmailAlreadyExistsException
import com.codeai.application.connector.InvalidPasswordException
import com.codeai.application.connector.NotifyNotConfiguredException
import com.codeai.application.connector.PipelineNotFoundException
import com.codeai.application.connector.SlackWebhookException
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleIllegalArgument(e: IllegalArgumentException): ApiResponse<Nothing> =
        ApiResponse.fail("INVALID_PARAMETERS", e.message ?: "잘못된 요청입니다.")

    // ---- 커넥터 (Phase 5) ----

    @ExceptionHandler(ConnectorNotSupportedException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleConnectorNotSupported(e: ConnectorNotSupportedException): ApiResponse<Nothing> =
        ApiResponse.fail("CONNECTOR_NOT_SUPPORTED", e.message ?: "지원하지 않는 플러그인입니다.")

    @ExceptionHandler(NotifyNotConfiguredException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleNotifyNotConfigured(e: NotifyNotConfiguredException): ApiResponse<Nothing> =
        ApiResponse.fail("NOTIFY_NOT_CONFIGURED", e.message ?: "알림 채널이 설정되지 않았습니다.")

    @ExceptionHandler(ConnectorTestFailedException::class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    fun handleConnectorTestFailed(e: ConnectorTestFailedException): ApiResponse<Nothing> =
        ApiResponse.fail("CONNECTOR_TEST_FAILED", e.message ?: "연결 테스트에 실패했습니다.")

    @ExceptionHandler(AiEngineException::class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    fun handleAiEngine(e: AiEngineException): ApiResponse<Nothing> =
        ApiResponse.fail("AI_ENGINE_ERROR", e.message ?: "AI 엔진 호출에 실패했습니다.")

    @ExceptionHandler(EmailAlreadyExistsException::class)
    @ResponseStatus(HttpStatus.CONFLICT)
    fun handleEmailAlreadyExists(e: EmailAlreadyExistsException): ApiResponse<Nothing> =
        ApiResponse.fail("AUTH_EMAIL_ALREADY_EXISTS", e.message ?: "이미 사용 중인 이메일입니다.")

    @ExceptionHandler(InvalidPasswordException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleInvalidPassword(e: InvalidPasswordException): ApiResponse<Nothing> =
        ApiResponse.fail("AUTH_004", e.message ?: "현재 비밀번호가 올바르지 않습니다.")

    @ExceptionHandler(PipelineNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handlePipelineNotFound(e: PipelineNotFoundException): ApiResponse<Nothing> =
        ApiResponse.fail("PIPELINE_NOT_FOUND", e.message ?: "파이프라인을 찾을 수 없습니다.")

    @ExceptionHandler(SlackWebhookException::class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    fun handleSlackWebhook(e: SlackWebhookException): ApiResponse<Nothing> =
        ApiResponse.fail("SLACK_WEBHOOK_ERROR", e.message ?: "Slack 웹훅 전송에 실패했습니다.")

    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(e: NoSuchElementException): ApiResponse<Nothing> =
        ApiResponse.fail("RESOURCE_NOT_FOUND", e.message ?: "리소스를 찾을 수 없습니다.")

    @ExceptionHandler(Exception::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun handleException(e: Exception): ApiResponse<Nothing> {
        e.printStackTrace()
        return ApiResponse.fail("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다.")
    }
}
