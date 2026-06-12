package com.codeai.presentation.common

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val error: ApiError? = null
) {
    companion object {
        fun <T> ok(data: T, message: String = "OK") =
            ApiResponse(success = true, data = data, message = message)

        fun ok(message: String = "OK") =
            ApiResponse<Nothing>(success = true, message = message)

        fun fail(code: String, message: String) =
            ApiResponse<Nothing>(success = false, error = ApiError(code, message))
    }
}

data class ApiError(val code: String, val message: String)
