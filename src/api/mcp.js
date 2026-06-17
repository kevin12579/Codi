import apiClient from './client'

export const getMcpTools = async () => {
    const response = await apiClient.get('/mcp/tools')
    return response.data
    }

    export const getRepositories = async () => {
    const response = await apiClient.get('/repositories')
    return response.data
}
