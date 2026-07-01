package com.codeai.infrastructure.config

import com.codeai.mcp.CodiMcpTools
import org.springframework.ai.tool.ToolCallbackProvider
import org.springframework.ai.tool.method.MethodToolCallbackProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class McpConfig {

    @Bean
    fun codiToolCallbackProvider(tools: CodiMcpTools): ToolCallbackProvider =
        MethodToolCallbackProvider.builder().toolObjects(tools).build()
}
