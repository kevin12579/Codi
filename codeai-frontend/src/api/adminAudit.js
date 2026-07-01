const ADMIN_AUDIT_LOG_STORAGE_KEY = 'adminAuditLogsV1'
const MAX_AUDIT_LOG_COUNT = 300

const nowIso = () => new Date().toISOString()

const toSafeRole = (value) => (String(value || 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER')

const readCurrentActor = () => {
    try {
        const raw = localStorage.getItem('currentUser')
        if (!raw) {
            return { username: 'unknown', email: '-', role: 'USER' }
        }
        const parsed = JSON.parse(raw)
        return {
            username: parsed?.username || 'unknown',
            email: parsed?.email || '-',
            role: toSafeRole(parsed?.role),
        }
    } catch {
        return { username: 'unknown', email: '-', role: 'USER' }
    }
}

export const getAdminAuditLogs = () => {
    try {
        const raw = localStorage.getItem(ADMIN_AUDIT_LOG_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export const appendAdminAuditLog = ({ action, message, category = 'system', meta = {} }) => {
    const entry = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        at: nowIso(),
        action: action || 'UNKNOWN_ACTION',
        message: message || '',
        category,
        actor: readCurrentActor(),
        meta,
    }

    const current = getAdminAuditLogs()
    const next = [entry, ...current].slice(0, MAX_AUDIT_LOG_COUNT)

    try {
        localStorage.setItem(ADMIN_AUDIT_LOG_STORAGE_KEY, JSON.stringify(next))
    } catch {
    }

    return entry
}

export const clearAdminAuditLogs = () => {
    try {
        localStorage.removeItem(ADMIN_AUDIT_LOG_STORAGE_KEY)
    } catch {
    }
}
