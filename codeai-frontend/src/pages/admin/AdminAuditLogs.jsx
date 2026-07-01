import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck } from 'lucide-react'
import { fetchAuditLogs, AUDIT_ACTIONS } from '../../api/auditLogs'

const actionBadge = (action) => {
    if (action === 'DEPLOY_APPROVE') return 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
    if (action?.startsWith('REPO')) return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
    if (action === 'CONNECTOR_UPDATE') return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
    if (action === 'LOGIN' || action === 'LOGOUT') return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
    return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
}

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionFilter, setActionFilter] = useState('전체')

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchAuditLogs({ action: actionFilter === '전체' ? undefined : actionFilter })
            setLogs(data.content || [])
            setTotal(data.totalElements || 0)
        } catch (err) {
            setError(err?.response?.data?.error?.message || err.message)
        } finally {
            setLoading(false)
        }
    }, [actionFilter])

    useEffect(() => { load() }, [load])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={22} className="text-rose-500" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">감사 로그 (보안)</h1>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        로그인·커넥터 변경·배포 승인·레포 등록·MCP 호출 등 보안 행위가 기록됩니다.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm flex flex-wrap items-center gap-1.5">
                {AUDIT_ACTIONS.map(f => (
                    <button key={f} onClick={() => setActionFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            actionFilter === f ? 'bg-[#0066ff] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}>
                        {f}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">{total}건</span>
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>}
            {loading && <p className="text-sm text-slate-400 dark:text-slate-500">데이터를 불러오는 중...</p>}

            {!loading && !error && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 w-48">시각</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 w-40">행위</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 w-24">행위자</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400">대상 / 상세</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 w-32">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {logs.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-16 text-sm text-slate-400">감사 이력이 없습니다.</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{log.createdAt}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${actionBadge(log.action)}`}>{log.action}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs">{log.actorId ?? 'system'}</td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                                        <span className="font-mono">{log.target || '-'}</span>
                                        {log.detail && <span className="text-slate-400"> · {log.detail}</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{log.ip || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
