import apiClient from './client'

export const fetchRepositories = async () => {
    const res = await apiClient.get('/repositories')
    if (!res.data?.success) throw new Error(res.data?.error?.message || '레포지토리 조회 실패')
    return res.data.data.content || []
}

// v0.9(D21): 레포 등록 + Webhook URL·Secret 발급 (ADMIN)
export const registerRepository = async ({ fullName, url, defaultBranch }) => {
    const res = await apiClient.post('/repositories', { fullName, url, defaultBranch })
    return res.data // { success, data: { id, fullName, webhookUrl, webhookSecret, isActive, alreadyExists }, message }
}

// 활성/비활성 토글 (ADMIN)
export const toggleRepository = async (id, isActive) => {
    const res = await apiClient.patch(`/repositories/${id}`, { isActive })
    return res.data
}

export const isAdminUser = () => {
    try {
        const raw = localStorage.getItem('currentUser')
        if (!raw) return false
        return String(JSON.parse(raw)?.role || 'USER').toUpperCase() === 'ADMIN'
    } catch {
        return false
    }
}
