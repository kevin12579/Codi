package com.codeai.domain.notification

// 설계 §3: channel_id 허용값 (소문자 플러그인 ID). V1=slack 단독.
object NotificationChannelId {
    const val SLACK = "slack"
    const val DISCORD = "discord"
    const val TEAMS = "teams"
}

enum class NotificationStatus { PENDING, SENT, FAILED }
