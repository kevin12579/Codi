import apiClient from './client'

// v0.9(D11): 보안/행위 감사 로그 조회 (ADMIN) — GET /api/audit-logs
export const fetchAuditLogs = async ({ action, actorId, from, to, page = 0, size = 50 } = {}) => {
    const params = {}
    if (action) params.action = action
    if (actorId) params.actorId = actorId
    if (from) params.from = from
    if (to) params.to = to
    params.page = page
    params.size = size
    const res = await apiClient.get('/audit-logs', { params })
    if (!res.data?.success) throw new Error(res.data?.error?.message || '감사 로그 조회 실패')
    return res.data.data // { content, totalElements, page, size }
}

export const AUDIT_ACTIONS = ['전체', 'LOGIN', 'LOGOUT', 'CONNECTOR_UPDATE', 'DEPLOY_APPROVE', 'REPO_REGISTER', 'REPO_TOGGLE', 'MCP_TOOL_CALL']
