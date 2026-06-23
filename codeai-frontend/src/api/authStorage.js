const REGISTERED_USERS_KEY = "registeredUsers"
const CURRENT_USER_KEY = "currentUser"
const AUTH_TOKEN_KEY = "authToken"
const TOKEN_TYPE_KEY = "tokenType"
const TOKEN_EXPIRES_IN_KEY = "tokenExpiresIn"

const safeParseArray = (value) => {
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export const getRegisteredUsers = () => safeParseArray(localStorage.getItem(REGISTERED_USERS_KEY))
export const setRegisteredUsers = (users) => localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(Array.isArray(users) ? users : []))

export const getCurrentUser = () => {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return { username: raw, email: `${raw}@example.com` } }
}

export const setCurrentUser = (user) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const setAuthSession = ({ accessToken, tokenType = "Bearer", expiresIn = 0 }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken || "")
    localStorage.setItem(TOKEN_TYPE_KEY, tokenType)
    localStorage.setItem(TOKEN_EXPIRES_IN_KEY, String(expiresIn))
}

export const clearAuthSession = () => {
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_TYPE_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_IN_KEY)
}