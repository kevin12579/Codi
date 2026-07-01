package com.codeai.presentation.connector

/** PUT /api/connectors/{category} 요청 (IA문서 §4). */
data class ConnectorUpdateRequest(
    val activeProviders: List<String> = emptyList(),
    val config: Map<String, Map<String, String>> = emptyMap(),
)

/** 카테고리 내 단일 프로바이더 상태. */
data class ConnectorProviderDto(
    val id: String,
    val name: String,
    val configured: Boolean,
    /** 설정된 키/URL의 마스킹 힌트(앞 4자 + 점). 미설정이면 null. */
    val keyHint: String? = null,
)

/** GET /api/connectors 의 각 카테고리 값. */
data class ConnectorCategoryDto(
    val active: String,
    val available: List<ConnectorProviderDto>,
)

/** GET /api/connectors/{category} 응답. */
data class ConnectorCategoryDetailDto(
    val category: String,
    val active: String,
    val available: List<ConnectorProviderDto>,
)

/** PUT /api/connectors/{category} 응답. */
data class ConnectorUpdateResultDto(
    val category: String,
    val active: String,
)

/** POST /api/connectors/ai/test 응답. */
data class AiTestResultDto(
    val engine: String,
    val latencyMs: Long,
    val sampleReview: String,
)

/** POST /api/connectors/notify/test 응답. */
data class NotifyTestResultDto(
    val sent: Boolean,
    val channel: String,
    val sentAt: String,
)
