    import { useState } from 'react'
    import { Search } from 'lucide-react'

    const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}분 ${s}초`
    }

    const formatDate = (isoString) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleString('ko-KR')
    }

    export default function PipelineList({ pipelines = [], onSelectPipeline }) {
    const [searchTerm, setSearchTerm] = useState('')

    const statusBadgeClass = (status) => {
        const s = status?.toUpperCase()
        if (s === 'SUCCESS') return 'bg-emerald-50 text-emerald-600'
        if (s === 'FAILED') return 'bg-red-50 text-red-600'
        if (s === 'RUNNING') return 'bg-blue-50 text-blue-600'
        return 'bg-slate-50 text-slate-600'
    }

    const filteredPipelines = pipelines.filter((p) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
        String(p.id).includes(term) ||
        (p.repositoryFullName ?? '').toLowerCase().includes(term) ||
        (p.prAuthor ?? '').toLowerCase().includes(term) ||
        (p.prTitle ?? '').toLowerCase().includes(term)
        )
    })

    return (
        <div className="space-y-6">
        <div className="grid grid-cols-[1fr,auto] items-center gap-6 mb-6">
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight flex items-center">
            <span className="text-2xl mr-2">✦</span>
            <span className="truncate">전체 파이프라인</span>
            </h1>
            <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
                type="text"
                placeholder="ID, 저장소, 작성자, PR 제목 검색..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0066ff] w-72 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
        </div>

        <hr className="border-slate-200 mb-6" />

        <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-[#e2e8f0]">
                <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">저장소</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PR</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">작성자</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">소요 시간</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">실행 시각</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {pipelines.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-lg w-8" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-lg w-36" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-lg w-48" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-lg w-20" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-lg w-16" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-lg w-28" /></td>
                    </tr>
                ))
                ) : filteredPipelines.length > 0 ? (
                filteredPipelines.map((p) => (
                    <tr
                    key={p.id}
                    onClick={() => onSelectPipeline(p.id)}
                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-[#0066ff] transition-all font-mono">
                        {p.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 group-hover:text-[#0066ff] transition-colors">
                        {p.repositoryFullName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        #{p.prNumber} {p.prTitle}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                        {p.prAuthor}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusBadgeClass(p.status)}`}>
                        {p.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {formatDuration(p.durationSeconds)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                        {formatDate(p.startedAt)}
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">
                    검색 결과가 없습니다.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
    }