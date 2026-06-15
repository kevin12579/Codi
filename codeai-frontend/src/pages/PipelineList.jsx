    import { useState, useEffect } from 'react'
    import { Search } from 'lucide-react'

    // ─── 유틸 함수 ────────────────────────────────────────────────
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

    export default function PipelineList({ onSelectPipeline }) {
    const [pipelines, setPipelines] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const savedToken = localStorage.getItem("authToken")

    // 상태 배지 스타일 함수
    const statusBadgeClass = (status) => {
        const s = status?.toUpperCase()
        if (s === 'SUCCESS') return 'bg-emerald-50 text-emerald-600'
        if (s === 'FAILED') return 'bg-red-50 text-red-600'
        if (s === 'RUNNING') return 'bg-blue-50 text-blue-600'
        return 'bg-slate-50 text-slate-600'
    }

    // ─── API 연동 로직: 최초 1회 전체 목록 로드 ──────────────
    useEffect(() => {
        const fetchPipelines = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/pipelines', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}`
            }
            })
            const result = await response.json()

            if (result.success) {
            setPipelines(result.data.content)
            }
        } catch (err) {
            console.error("파이프라인 데이터 로드 실패:", err)
            setError(true)
        } finally {
            setLoading(false)
        }
        }

        fetchPipelines()
    }, [])

    // ─── 클라이언트 사이드 검색 필터링 ──────────────
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
        {/* 헤더 */}
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900">전체 파이프라인</h2>
            <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
                type="text"
                placeholder="ID, 저장소, 작성자, PR 제목 검색..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0066ff] w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
        </div>

        {/* 테이블 */}
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
                {loading ? (
                <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">데이터를 불러오는 중...</td>
                </tr>
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
                    {error ? '데이터를 불러오지 못했습니다.' : '검색 결과가 없습니다.'}
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
    }