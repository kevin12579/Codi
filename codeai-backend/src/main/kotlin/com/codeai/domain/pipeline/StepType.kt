package com.codeai.domain.pipeline

enum class StepType { WEBHOOK, REVIEW, TEST, NOTIFY, DEPLOY }

enum class StepStatus { PENDING, RUNNING, SUCCESS, FAILED, SKIPPED }
