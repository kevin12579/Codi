package com.codeai

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class CodeAiApplication

fun main(args: Array<String>) {
    runApplication<CodeAiApplication>(*args)
}
