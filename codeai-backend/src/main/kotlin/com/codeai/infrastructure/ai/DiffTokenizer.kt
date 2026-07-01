package com.codeai.infrastructure.ai

object DiffTokenizer {

    fun splitByTokenBudget(diff: String, maxTokens: Int): List<String> {
        val approxCharsPerToken = 4
        val maxChars = maxTokens * approxCharsPerToken

        if (diff.length <= maxChars) return listOf(diff)

        val chunks = mutableListOf<String>()
        val lines = diff.lines()
        val currentChunk = StringBuilder()

        for (line in lines) {
            if (currentChunk.length + line.length + 1 > maxChars) {
                if (currentChunk.isNotEmpty()) {
                    chunks.add(currentChunk.toString())
                    currentChunk.clear()
                }
            }
            currentChunk.appendLine(line)
        }

        if (currentChunk.isNotEmpty()) chunks.add(currentChunk.toString())
        return chunks.ifEmpty { listOf(diff.take(maxChars)) }
    }
}
