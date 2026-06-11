package com.codeai.infrastructure.playwright

import com.codeai.domain.testrun.TestCase
import com.codeai.domain.testrun.TestResult
import org.slf4j.LoggerFactory

data class PlaywrightResult(
    val totalTests: Int,
    val passed: Int,
    val failed: Int,
    val skipped: Int,
    val cases: List<ParsedTestCase>
)

data class ParsedTestCase(
    val name: String,
    val status: TestResult,
    val durationMs: Int?,
    val errorMessage: String?
)

object PlaywrightResultParser {
    private val log = LoggerFactory.getLogger(this::class.java)

    fun parse(jsonOutput: String): PlaywrightResult {
        return try {
            parseJsonReport(jsonOutput)
        } catch (e: Exception) {
            log.warn("JSON 파싱 실패, 텍스트 파싱 시도: ${e.message}")
            parseTextOutput(jsonOutput)
        }
    }

    private fun parseJsonReport(json: String): PlaywrightResult {
        val passedMatch = Regex(""""expected"\s*:\s*(\d+)""").find(json)
        val failMatch = Regex(""""unexpected"\s*:\s*(\d+)""").find(json)
        val skipMatch = Regex(""""skipped"\s*:\s*(\d+)""").find(json)

        val passed = passedMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0
        val failed = failMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0
        val skipped = skipMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0

        val cases = extractCases(json)
        return PlaywrightResult(
            totalTests = passed + failed + skipped,
            passed = passed, failed = failed, skipped = skipped,
            cases = cases
        )
    }

    private fun parseTextOutput(text: String): PlaywrightResult {
        val passed = Regex("""(\d+)\s+passed""").find(text)?.groupValues?.get(1)?.toIntOrNull() ?: 0
        val failed = Regex("""(\d+)\s+failed""").find(text)?.groupValues?.get(1)?.toIntOrNull() ?: 0
        val skipped = Regex("""(\d+)\s+skipped""").find(text)?.groupValues?.get(1)?.toIntOrNull() ?: 0
        return PlaywrightResult(
            totalTests = passed + failed + skipped,
            passed = passed, failed = failed, skipped = skipped,
            cases = emptyList()
        )
    }

    private fun extractCases(json: String): List<ParsedTestCase> {
        val results = mutableListOf<ParsedTestCase>()
        val titles = Regex(""""title"\s*:\s*"([^"]+)"""").findAll(json).map { it.groupValues[1] }.toList()
        val statuses = Regex(""""status"\s*:\s*"(passed|failed|skipped)"""").findAll(json).map { it.groupValues[1] }.toList()
        val durations = Regex(""""duration"\s*:\s*(\d+)""").findAll(json).map { it.groupValues[1].toIntOrNull() }.toList()

        titles.forEachIndexed { i, title ->
            val status = when (statuses.getOrNull(i)) {
                "passed" -> TestResult.PASSED
                "failed" -> TestResult.FAILED
                else -> TestResult.SKIPPED
            }
            results.add(ParsedTestCase(name = title, status = status, durationMs = durations.getOrNull(i), errorMessage = null))
        }
        return results
    }

    fun toDomainCases(parsed: PlaywrightResult, testRunId: Long): List<TestCase> =
        parsed.cases.map { c ->
            TestCase(testRunId = testRunId, testName = c.name, status = c.status, durationMs = c.durationMs, errorMessage = c.errorMessage)
        }
}
