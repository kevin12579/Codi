import apiClient from './client'

export const getSettings = async () => {
    const response = await apiClient.get('/settings')
    return response.data
}
