import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import apiClient from '../../api/client'
import { formatDate } from '../../lib/formatDate'

export default function RepositorySettings() {
    const [repositories, setRepositories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        apiClient.get('/repositories')
            .then(res => {
                if (res.data.success) setRepositories(res.data.data.content || [])
                else setError(res.data.error?.message || '불러오기 실패')
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 items-end mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✦</span>
                        <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">레포지토리 관리</h1>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="px-3 py-1 bg-[#e6f0ff] dark:bg-blue-900/30 border border-[#bfdbfe] dark:border-blue-800 rounded-lg text-xs font-bold text-[#0066ff] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
                        {loading ? '불러오는 중...' : `${repositories.length}개 연결됨`}
                    </div>
                </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>}
            {loading && <div className="flex items-center justify-center h-48 text-sm text-slate-400">불러오는 중...</div>}
            {!loading && !error && repositories.length === 0 && (
                <div className="flex items-center justify-center h-48 text-sm text-slate-400">연결된 레포지토리가 없습니다.</div>
            )}

            {!loading && repositories.map((repo) => (
                <div key={repo.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{repo.fullName}</h3>
                            <a href={repo.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0066ff] transition-colors">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
                            repo.isActive
                                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'text-slate-500 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                        }`}>
                            {repo.isActive ? '✓ 활성' : '비활성'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">기본 브랜치</label>
                            <input type="text" value={repo.defaultBranch} readOnly
                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-default" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">연결일</label>
                            <input type="text" value={formatDate(repo.createdAt)} readOnly
                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-default" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Webhook URL</label>
                            <input type="text" value={repo.webhookUrl} readOnly
                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-default" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}