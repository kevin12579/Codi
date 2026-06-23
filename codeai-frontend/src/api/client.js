import axios from 'axios'
import { getAuthToken } from './authStorage'

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim()
const resolvedBaseUrl = configuredApiUrl || '/api'

const apiClient = axios.create({
    baseURL: resolvedBaseUrl,
    timeout: 10000,
    })

export const isApiEnabled = () => import.meta.env.VITE_API_ENABLED === 'true'

    apiClient.interceptors.request.use((config) => {
    const token = getAuthToken()
    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
    })

    export const getApiErrorCode = (error) => {
    return error?.response?.data?.error?.code || null
    }

    export const getApiErrorMessage = (error, fallback = '요청 처리 중 오류가 발생했습니다.') => {
    const code = getApiErrorCode(error)

    if (code === 'CONNECTOR_NOT_SUPPORTED') return '지원하지 않는 커넥터입니다.'
    if (code === 'CONNECTOR_TEST_FAILED') return '연결 테스트에 실패했습니다. 설정 값을 확인해주세요.'
    if (code === 'AI_ENGINE_ERROR') return 'AI 엔진 호출 중 오류가 발생했습니다.'
    if (code === 'NOTIFY_NOT_CONFIGURED') return '알림 채널이 설정되지 않았습니다.'
    if (code === 'PLAYWRIGHT_TIMEOUT') return '테스트 실행이 제한 시간을 초과했습니다.'

    return (
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        fallback
    )
}

export default apiClient
