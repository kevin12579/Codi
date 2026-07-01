import { useState, useEffect } from 'react'
import { ExternalLink, Plus, Copy, Check, ShieldAlert } from 'lucide-react'
import { formatDate } from '../../lib/formatDate'
import { fetchRepositories, registerRepository, toggleRepository, isAdminUser } from '../../api/repositories'

export default function RepositorySettings() {
    const [repositories, setRepositories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const admin = isAdminUser()

    // 등록 폼
    const [fullName, setFullName] = useState('')
    const [registering, setRegistering] = useState(false)
    const [issued, setIssued] = useState(null)   // { webhookUrl, webhookSecret } — 1회 발급 안내
    const [copied, setCopied] = useState(null)

    const load = () => {
        setLoading(true)
        fetchRepositories()
            .then(list => { setRepositories(list); setError(null) })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }
    useEffect(() => { load() }, [])

    const copy = (text, key) => {
        navigator.clipboard.writeText(text)
        setCopied(key)
        setTimeout(() => setCopied(null), 1600)
    }

    const onRegister = async (e) => {
        e.preventDefault()
        if (!fullName.trim() || registering) return
        setRegistering(true)
        setError(null)
        try {
            const result = await registerRepository({ fullName: fullName.trim() })
            if (result?.success) {
                setIssued({
                    fullName: result.data.fullName,
                    webhookUrl: result.data.webhookUrl,
                    webhookSecret: result.data.webhookSecret,
                    alreadyExists: result.data.alreadyExists,
                })
                setFullName('')
                load()
            } else {
                setError(result?.error?.message || '등록 실패')
            }
        } catch (err) {
            setError(err?.response?.data?.error?.message || err.message || '등록 실패')
        } finally {
            setRegistering(false)
        }
    }

    const onToggle = async (repo) => {
        try {
            const result = await toggleRepository(repo.id, !repo.isActive)
            if (result?.success) load()
            else setError(result?.error?.message || '상태 변경 실패')
        } catch (err) {
            setError(err?.response?.data?.error?.message || err.message || '상태 변경 실패')
        }
    }

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

            {/* v0.9(D21): 레포 등록 (ADMIN) — full_name 입력 → Webhook URL·Secret 발급 */}
            {admin ? (
                <form onSubmit={onRegister} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">레포지토리 등록 (owner/repo)</label>
                    <div className="flex gap-2">
                        <input
                            type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                            placeholder="예: kevin12579/Codi"
                            className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:border-[#0066ff]"
                        />
                        <button type="submit" disabled={registering}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black transition-all cursor-pointer">
                            <Plus size={15} /> {registering ? '등록 중…' : '등록'}
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold">
                        등록 후 발급되는 Webhook URL·Secret 을 GitHub <span className="font-mono">Settings → Webhooks</span> 에 붙여넣으면 해당 레포의 PR 이 코디로 연결됩니다.
                        (원클릭 자동 연결은 V2 — GitHub App)
                    </p>
                </form>
            ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                    <ShieldAlert size={14} /> 레포 등록·상태 변경은 관리자(ADMIN)만 가능합니다.
                </div>
            )}

            {/* 발급 안내 (1회 표시) */}
            {issued && (
                <div className="bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                        {issued.alreadyExists ? '이미 등록된 레포지토리' : 'Webhook 발급 완료'} — {issued.fullName}
                    </p>
                    {['webhookUrl', 'webhookSecret'].map((k) => (
                        <div key={k}>
                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">{k === 'webhookUrl' ? 'Payload URL' : 'Secret'}</label>
                            <div className="flex gap-2">
                                <input readOnly value={issued[k]}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-mono focus:outline-none" />
                                <button onClick={() => copy(issued[k], k)}
                                    className="inline-flex items-center gap-1 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
                                    {copied === k ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <p className="text-[11px] text-indigo-500/80 font-semibold">Content type 은 <span className="font-mono">application/json</span>, 이벤트는 <span className="font-mono">Pull requests</span> 를 선택하세요.</p>
                </div>
            )}

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
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
                                repo.isActive
                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : 'text-slate-500 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                            }`}>
                                {repo.isActive ? '✓ 활성' : '비활성'}
                            </span>
                            {admin && (
                                <button onClick={() => onToggle(repo)}
                                    className="text-xs font-bold px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-[#0066ff] hover:border-[#0066ff] transition-colors cursor-pointer">
                                    {repo.isActive ? '비활성화' : '활성화'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">기본 브랜치</label>
                            <input type="text" value={repo.defaultBranch} readOnly
                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-default" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">연결 방식 / 연결일</label>
                            <input type="text" value={`${repo.connectMode || 'MANUAL'} · ${formatDate(repo.createdAt)}`} readOnly
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
