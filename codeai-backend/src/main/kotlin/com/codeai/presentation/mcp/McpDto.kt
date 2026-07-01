package com.codeai.presentation.mcp

import com.fasterxml.jackson.annotation.JsonInclude

/** GET /api/mcp/tools 응답 (IA문서 §4 MCP). */
data class McpToolsResponse(
    val serverName: String,
    val version: String,
    val endpoint: String,
    val transport: String,
    val tools: List<McpToolInfo>,
)

data class McpToolInfo(
    val name: String,
    val description: String,
    val parameters: Map<String, McpParamInfo>,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class McpParamInfo(
    val type: String,
    val description: String,
    val enum: List<String>? = null,
)
