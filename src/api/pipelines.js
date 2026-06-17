import apiClient from './client'

export const getPipelines = async (params = {}) => {
    const response = await apiClient.get('/pipelines', { params })
    return response.data
    }

    export const getPipelineDetail = async (id) => {
    const response = await apiClient.get(`/pipelines/${id}`)
    return response.data
    }

    export const getPipelineStats = async (params = {}) => {
    const response = await apiClient.get('/pipelines/stats', { params })
    return response.data
}
