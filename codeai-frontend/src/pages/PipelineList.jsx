    import { useState, useEffect  } from 'react'
    import { Search } from 'lucide-react'

    const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}분 ${s}초`
    }

    const formatDate = (isoString) => {
    if (!isoString) return '-'
    
    // 1. 서버에서 받은 시간을 Date 객체로 생성
    const date = new Date(isoString);
    
    // 2. 9시간(9 * 60 * 60 * 1000 = 32,400,000ms)을 강제로 더함
    const kstDate = new Date(date.getTime() + 32400000);
    
    // 3. 한국 시간으로 포맷팅
    return kstDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
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

    //----------------페이지 슬라이싱 --------------------------------------
    const ITEMS_PER_PAGE = 10
    const [currentPage, setCurrentPage] = useState(1)

    // 검색어 바뀌면 1페이지로 리셋
    useEffect(() => {
    setCurrentPage(1)
    }, [searchTerm])

    const totalPages = Math.ceil(filteredPipelines.length / ITEMS_PER_PAGE)
    const pagedPipelines = filteredPipelines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
    )

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
                pagedPipelines.map((p) => (
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

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-4">
                    <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:border-[#0066ff] hover:text-[#0066ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                    이전
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        currentPage === page
                            ? 'bg-[#0066ff] text-white border-[#0066ff]'
                            : 'border-slate-200 text-slate-500 hover:border-[#0066ff] hover:text-[#0066ff]'
                        }`}
                    >
                        {page}
                    </button>
                    ))}

                    <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:border-[#0066ff] hover:text-[#0066ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                    다음
                    </button>
                </div>
                )}
        </div>
        </div>
    )
    }