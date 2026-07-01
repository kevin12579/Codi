import apiClient from './client'

export const getConnectorsOverview = async () => {
    const response = await apiClient.get('/connectors')
    return response.data
    }

    export const getConnectorCategory = async (category) => {
    const response = await apiClient.get(`/connectors/${category}`)
    return response.data
    }

    export const updateConnectorCategory = async (category, payload) => {
    const response = await apiClient.put(`/connectors/${category}`, payload)
    return response.data
    }

    export const testConnectorCategory = async (category) => {
    const response = await apiClient.post(`/connectors/${category}/test`)
    return response.data
}
