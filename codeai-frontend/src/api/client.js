import axios from 'axios'
import { getAuthToken } from './authStorage'

// 1. 안전하게 두 환경변수를 모두 체크하도록 통합합니다.
const currentApiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();

// 2. 주소 뒤에 /api가 중복으로 붙지 않도록 깔끔하게 정제합니다.
const cleanApiUrl = currentApiUrl.endsWith('/api') ? currentApiUrl : `${currentApiUrl}/api`;

const apiClient = axios.create({
    // 3. 환경변수 값이 아예 없으면 그때만 로컬 프록시용 '/api'를 타게 만듭니다.
    baseURL: currentApiUrl ? cleanApiUrl : '/api', 
})

export const isApiEnabled = () => import.meta.env.VITE_API_ENABLED === 'true'

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken()
    config.headers = config.headers || {}
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['ngrok-skip-browser-warning'] = 'true'  // ngrok 경고 패스 헤더
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