package com.codeai.infrastructure.ai

object MaskingUtil {
    private val patterns = listOf(
        Regex("((?:API_KEY|SECRET|PASSWORD|TOKEN|AUTH)\\s*=\\s*)([^\\s\"']+)", RegexOption.IGNORE_CASE),
        Regex("(sk-ant-api[0-9A-Za-z\\-]+)"),
        Regex("(ghp_[0-9A-Za-z]+)"),
        Regex("(xoxb-[0-9A-Za-z\\-]+)")
    )

    fun mask(content: String): String {
        var result = content
        for (pattern in patterns) {
            result = pattern.replace(result) { matchResult ->
                if (matchResult.groupValues.size > 2 && matchResult.groupValues[2].isNotEmpty()) {
                    matchResult.groupValues[1] + "***MASKED***"
                } else {
                    "***MASKED***"
                }
            }
        }
        return result
    }
}
