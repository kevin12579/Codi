package com.codeai.infrastructure.playwright

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Docker 컨테이너 내에서 Playwright E2E 테스트를 headless로 실행합니다.
 * docker-compose의 playwright 서비스 또는 로컬 npx playwright를 통해 실행합니다.
 */
@Component
class PlaywrightRunner(
    @Value("\${playwright.working-dir:./codeai-frontend}") private val workingDir: String,
    @Value("\${playwright.timeout-ms:120000}") private val timeoutMs: Long,
    @Value("\${playwright.use-docker:false}") private val useDocker: Boolean,
    @Value("\${playwright.docker-image:mcr.microsoft.com/playwright:v1.44.0-jammy}") private val dockerImage: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    suspend fun run(testFilter: String? = null): PlaywrightResult = withContext(Dispatchers.IO) {
        log.info("Playwright 테스트 실행 시작: filter=$testFilter, useDocker=$useDocker")

        val command = buildCommand(testFilter)
        log.debug("실행 명령: ${command.joinToString(" ")}")

        val result = withTimeoutOrNull(timeoutMs) {
            executeProcess(command)
        }

        if (result == null) {
            log.error("Playwright 테스트 타임아웃: ${timeoutMs}ms 초과")
            return@withContext PlaywrightResult(
                totalTests = 0, passed = 0, failed = 1, skipped = 0,
                cases = emptyList()
            )
        }

        val (exitCode, output) = result
        log.info("Playwright 완료: exitCode=$exitCode, output 길이=${output.length}")

        PlaywrightResultParser.parse(output)
    }

    private fun buildCommand(testFilter: String?): List<String> {
        return if (useDocker) {
            buildList {
                add("docker"); add("run"); add("--rm")
                add("-v"); add("${File(workingDir).absolutePath}:/work")
                add("-w"); add("/work")
                add(dockerImage)
                add("npx"); add("playwright"); add("test")
                add("--reporter=json")
                if (testFilter != null) { add("--grep"); add(testFilter) }
            }
        } else {
            buildList {
                add("npx"); add("playwright"); add("test")
                add("--reporter=json")
                if (testFilter != null) { add("--grep"); add(testFilter) }
            }
        }
    }

    private fun executeProcess(command: List<String>): Pair<Int, String> {
        val workDir = File(workingDir).let { if (it.exists()) it else File(".") }
        val process = ProcessBuilder(command)
            .directory(workDir)
            .redirectErrorStream(true)
            .start()

        val output = process.inputStream.bufferedReader().readText()
        val exitCode = if (process.waitFor(timeoutMs, TimeUnit.MILLISECONDS)) process.exitValue() else {
            process.destroyForcibly()
            1
        }
        return exitCode to output
    }
}
