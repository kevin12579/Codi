package com.codeai.presentation.repository

/** 레포 등록 요청 (v0.9 §4-3-1) */
data class RepositoryRegisterRequest(
    val fullName: String,
    val url: String? = null,
    val defaultBranch: String? = null
)

/** 활성/비활성 토글 요청 */
data class RepositoryToggleRequest(
    val isActive: Boolean
)
