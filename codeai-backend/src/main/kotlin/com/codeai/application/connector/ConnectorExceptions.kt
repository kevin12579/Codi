package com.codeai.application.connector

/** 미지원 플러그인 ID → 400 CONNECTOR_NOT_SUPPORTED */
class ConnectorNotSupportedException(message: String) : RuntimeException(message)

/** 연결 테스트 실패 → 502 CONNECTOR_TEST_FAILED */
class ConnectorTestFailedException(message: String) : RuntimeException(message)

/** 알림 채널 미설정 → 400 NOTIFY_NOT_CONFIGURED */
class NotifyNotConfiguredException(message: String) : RuntimeException(message)

/** AI 엔진 호출 실패 → 502 AI_ENGINE_ERROR */
class AiEngineException(message: String) : RuntimeException(message)

/** 이메일 중복 → 409 AUTH_EMAIL_ALREADY_EXISTS */
class EmailAlreadyExistsException(email: String) : RuntimeException("이미 사용 중인 이메일입니다: $email")

/** 파이프라인 미존재 → 404 PIPELINE_NOT_FOUND */
class PipelineNotFoundException(id: Long) : RuntimeException("파이프라인을 찾을 수 없습니다: id=$id")

/** Slack 웹훅 전송 실패 → 502 SLACK_WEBHOOK_ERROR */
class SlackWebhookException(message: String) : RuntimeException(message)
