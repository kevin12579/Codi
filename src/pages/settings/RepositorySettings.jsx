import { useEffect, useState } from 'react'
import { getRepositories } from '../../api/mcp'
import { isApiEnabled } from '../../api/client'

const fallbackRepos = [
    { name: 'codeai-frontend', branch: 'main', provider: 'github', webhook: '/webhook/github' },
    { name: 'codeai-backend', branch: 'develop', provider: 'github', webhook: '/webhook/github' },
    ]

    export default function RepositorySettings() {
    const apiEnabled = isApiEnabled()
    const [repositories, setRepositories] = useState(fallbackRepos)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!apiEnabled) return

        let mounted = true

        const loadRepositories = async () => {
        try {
            setIsLoading(true)
            const result = await getRepositories()
            const content = Array.isArray(result?.data?.content)
            ? result.data.content
            : Array.isArray(result?.data)
                ? result.data
                : []

            if (!mounted || content.length === 0) return

            setRepositories(
            content.map((repo) => ({
                name: repo.name || repo.fullName || repo.repositoryFullName || 'unknown-repo',
                branch: repo.branch || repo.defaultBranch || 'main',
                provider: repo.provider || repo.vcsId || 'github',
                webhook: repo.webhookUrl || `/webhook/${repo.provider || repo.vcsId || 'github'}`,
            }))
            )
        } catch {
            // Keep fallback repositories in local-only mode.
        } finally {
            if (mounted) setIsLoading(false)
        }
        }

        loadRepositories()
        return () => {
        mounted = false
        }
    }, [apiEnabled])

    return (
        <section className="space-y-4">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-800">SET002 · 레포지토리 관리</p>
            <p className="mt-1 text-xs text-slate-500">연결된 레포지토리와 Webhook 경로를 확인합니다.</p>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            {isLoading ? (
            <p className="text-sm text-slate-500">레포지토리 정보를 불러오는 중입니다...</p>
            ) : repositories.length === 0 ? (
            <p className="text-sm text-slate-500">연결된 레포지토리가 없습니다.</p>
            ) : (
            <div className="space-y-2">
                {repositories.map((repo) => (
                <div key={`${repo.name}-${repo.branch}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{repo.name}</p>
                    <p className="mt-1 text-xs text-slate-500">브랜치: {repo.branch}</p>
                    <p className="text-xs text-slate-500">Provider: {repo.provider}</p>
                    <p className="text-xs text-slate-500">Webhook: {repo.webhook}</p>
                </div>
                ))}
            </div>
            )}
        </div>
        </section>
    )
}
