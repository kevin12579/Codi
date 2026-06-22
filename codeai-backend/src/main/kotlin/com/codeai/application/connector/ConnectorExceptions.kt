package com.codeai.application.connector

/** 미지원 플러그인 ID → 400 CONNECTOR_NOT_SUPPORTED */
class ConnectorNotSupportedException(message: String) : RuntimeException(message)

/** 연결 테스트 실패 → 502 CONNECTOR_TEST_FAILED */
class ConnectorTestFailedException(message: String) : RuntimeException(message)

/** 알림 채널 미설정 → 400 NOTIFY_NOT_CONFIGURED */
class NotifyNotConfiguredException(message: String) : RuntimeException(message)

/** AI 엔진 호출 실패 → 502 AI_ENGINE_ERROR */
class AiEngineException(message: String) : RuntimeException(message)
