import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { formatDate } from '../lib/formatDate'

const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}분 ${s}초`
}

const STATUS_OPTIONS = [
    { value: '', label: '전체' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'RUNNING', label: 'RUNNING' },
    { value: 'SUCCESS', label: 'SUCCESS' },
    { value: 'FAILED', label: 'FAILED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
]

const PERIOD_OPTIONS = [
    { value: '', label: '전체' },
    { value: 'today', label: '오늘' },
    { value: '7d', label: '최근 7일' },
    { value: '30d', label: '최근 30일' },
    { value: 'custom', label: '직접 입력' },
]

const ITEMS_PER_PAGE = 10

export default function PipelineList({ onSelectPipeline }) {
    const [pipelines, setPipelines] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [statusFilter, setStatusFilter] = useState('')
    const [periodFilter, setPeriodFilter] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [repoFilter, setRepoFilter] = useState('')
    const [repositories, setRepositories] = useState([])

    const [currentPage, setCurrentPage] = useState(1)

    // 레포 목록 (필터 드롭다운용)
    useEffect(() => {
        const savedToken = localStorage.getItem('authToken')
        
        // 🔥 환경변수 주소 조립 및 정제
        const apiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
        const cleanUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
        const finalBaseUrl = apiUrl ? cleanUrl : '/api';

        // 🔥 주소 변경 및 헤더 추가
        fetch(`${finalBaseUrl}/repositories`, {
            headers: { 
                Authorization: `Bearer ${savedToken}`,
                'ngrok-skip-browser-warning': 'true' // ngrok 경고 패스 헤더 추가
            },
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    const list = json.data.content || json.data || []
                    setRepositories(list)
                }
            })
            .catch((err) => console.error('repositories fetch 실패:', err))
    }, [])

    // 기간 필터 선택값 -> from/to 날짜 계산
    useEffect(() => {
        if (periodFilter === 'custom') return // 직접 입력은 dateFrom/dateTo를 사용자가 채움

        if (!periodFilter) {
            setDateFrom('')
            setDateTo('')
            return
        }

        const now = new Date()
        const toStr = now.toISOString().slice(0, 10)
        let from = new Date(now)

        if (periodFilter === 'today') {
            // from = to = 오늘
        } else if (periodFilter === '7d') {
            from.setDate(from.getDate() - 7)
        } else if (periodFilter === '30d') {
            from.setDate(from.getDate() - 30)
        }

        setDateFrom(from.toISOString().slice(0, 10))
        setDateTo(toStr)
    }, [periodFilter])

    const fetchPipelines = () => {
        setIsLoading(true)
        const savedToken = localStorage.getItem('authToken')
        // 클라이언트 사이드에서 ITEMS_PER_PAGE(10)개씩 다시 나눠서 보여주므로
        // 서버에서는 필터에 해당하는 전체 파이프라인을 한 번에 받아온다
        const params = new URLSearchParams({ page: 0, size: 1000 })
        if (statusFilter) params.append('status', statusFilter)
        if (repoFilter) params.append('repositoryId', repoFilter)
        if (dateFrom) params.append('from', new Date(dateFrom).toISOString())
        if (dateTo) params.append('to', new Date(dateTo + 'T23:59:59').toISOString())

        // 🔥 환경변수 주소 조립 및 정제
        const apiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
        const cleanUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
        const finalBaseUrl = apiUrl ? cleanUrl : '/api';

        // 🔥 주소 변경 및 헤더 추가
        fetch(`${finalBaseUrl}/pipelines?${params}`, {
            headers: { 
                Authorization: `Bearer ${savedToken}`,
                'ngrok-skip-browser-warning': 'true' // ngrok 경고 패스 헤더 추가
            },
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setPipelines(json.data.content || json.data || [])
                }
            })
            .catch((err) => console.error('pipelines fetch 실패:', err))
            .finally(() => setIsLoading(false))
    }

    useEffect(() => {
        fetchPipelines()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, dateFrom, dateTo, repoFilter])

    const statusBadgeClass = (status) => {
        const s = status?.toUpperCase()
        if (s === 'SUCCESS') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
        if (s === 'FAILED') return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        if (s === 'RUNNING') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        return 'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
    }

    // 상태/기간/레포는 서버사이드 필터, 검색창(ID/저장소/작성자/PR 제목)은 클라이언트 사이드 유지
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

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, dateFrom, dateTo, repoFilter])

    const totalPages = Math.ceil(filteredPipelines.length / ITEMS_PER_PAGE)
    const pagedPipelines = filteredPipelines.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-[1fr,auto] items-center gap-6 mb-6">
                <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight flex items-center">
                    <span className="text-2xl mr-2">✦</span>
                    <span className="truncate">전체 파이프라인</span>
                </h1>
                <div className="relative shrink-0">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="ID, 저장소, 작성자, PR 제목 검색..."
                        className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 rounded-xl text-sm focus:outline-none focus:border-[#0066ff] w-72 transition-all"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 필터 바 */}
            <div className="flex flex-wrap items-center gap-2 -mt-2 mb-2">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0066ff]"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0066ff]"
                >
                    {PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {periodFilter === 'custom' && (
                    <>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0066ff]"
                        />
                        <span className="text-xs text-slate-400">~</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0066ff]"
                        />
                    </>
                )}

                <select
                    value={repoFilter}
                    onChange={(e) => setRepoFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0066ff]"
                >
                    <option value="">전체 레포</option>
                    {repositories.map((repo) => (
                        <option key={repo.id} value={repo.id}>
                            {repo.fullName || repo.name}
                        </option>
                    ))}
                </select>
            </div>

            <hr className="border-slate-200 dark:border-slate-700 mb-6" />

            <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-[#e2e8f0] dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">저장소</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PR</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">작성자</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">상태</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">소요 시간</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">실행 시각</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-8" /></td>
                                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-36" /></td>
                                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-48" /></td>
                                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-20" /></td>
                                    <td className="px-6 py-4"><div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-16" /></td>
                                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-16" /></td>
                                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-28" /></td>
                                </tr>
                            ))
                        ) : filteredPipelines.length > 0 ? (
                            pagedPipelines.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => onSelectPipeline(p.id)}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] transition-all font-mono">
                                        {p.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 group-hover:text-[#0066ff] transition-colors">
                                        {p.repositoryFullName}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        #{p.prNumber} {p.prTitle}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                        {p.prAuthor}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusBadgeClass(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        {formatDuration(p.durationSeconds)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">
                                        {formatDate(p.startedAt)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-4 pb-4">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-[#0066ff] hover:text-[#0066ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            이전
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    currentPage === page
                                        ? 'bg-[#0066ff] text-white border-[#0066ff]'
                                        : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-[#0066ff] hover:text-[#0066ff]'
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-[#0066ff] hover:text-[#0066ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}