    import { useState, useEffect } from 'react'
    import apiClient from '../../api/client'

    const ACTION_FILTERS = ['전체', '로그인', '파이프라인 실행', '설정 변경']
    const RESULT_FILTERS = ['전체', '성공', '실패']

    const MOCK_LOGS = [
    { id: 1, date: '2025-06-24 10:32', email: 'kim@codi.com',   action: '로그인',         result: '성공' },
    { id: 2, date: '2025-06-24 10:35', email: 'kim@codi.com',   action: '파이프라인 실행', result: '성공' },
    { id: 3, date: '2025-06-24 11:02', email: 'lee@codi.com',   action: '로그인',         result: '실패' },
    { id: 4, date: '2025-06-24 11:15', email: 'park@codi.com',  action: '설정 변경',       result: '성공' },
    { id: 5, date: '2025-06-24 12:00', email: 'admin@codi.com', action: '파이프라인 실행', result: '성공' },
    ]

    export default function AdminUserLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState('')
    const [actionFilter, setActionFilter] = useState('전체')
    const [resultFilter, setResultFilter] = useState('전체')

    useEffect(() => {
        const fetchLogs = async () => {
        try {
            setLoading(true)
            const res = await apiClient.get('/admin/user-logs')
            setLogs(res.data.data)
        } catch (err) {
            console.error(err)
            setLogs(MOCK_LOGS)
        } finally {
            setLoading(false)
        }
        }
        fetchLogs()
    }, [])

    const filtered = logs.filter(log => {
        const matchEmail  = log.email.toLowerCase().includes(search.toLowerCase())
        const matchAction = actionFilter === '전체' || log.action === actionFilter
        const matchResult = resultFilter === '전체' || log.result === resultFilter
        return matchEmail && matchAction && matchResult
    })

    return (
        <div className="space-y-6">

        {/* 헤더 */}
{/* 헤더 */}
<div className="flex items-center gap-3 mb-6">
    <span className="text-xl">✦</span>
    <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
            행위 이력 조회
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            일반 사용자의 모든 동작이 투명하게 기록됩니다.
        </p>
    </div>
</div>

        {/* 필터 영역 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm flex flex-wrap items-center gap-3">

            {/* 이메일 검색 */}
            <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이메일로 검색"
            className="flex-1 min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />

            {/* 작업 유형 필터 */}
            <div className="flex gap-1.5">
            {ACTION_FILTERS.map(f => (
                <button
                key={f}
                onClick={() => setActionFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    actionFilter === f
                    ? 'bg-[#0066ff] text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                >
                {f}
                </button>
            ))}
            </div>

            {/* 결과 필터 */}
            <div className="flex gap-1.5">
            {RESULT_FILTERS.map(f => (
                <button
                key={f}
                onClick={() => setResultFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    resultFilter === f
                    ? f === '실패' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                >
                {f}
                </button>
            ))}
            </div>

            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">{filtered.length}건</span>
        </div>

        {/* 로딩 */}
        {loading && (
            <p className="text-sm text-slate-400 dark:text-slate-500">데이터를 불러오는 중...</p>
        )}

        {/* 테이블 */}
        {!loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 w-44">날짜</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500">사용자</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 w-36">작업 유형</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 w-24">결과</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.length === 0 ? (
                    <tr>
                    <td colSpan={4} className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">
                        조건에 맞는 이력이 없습니다.
                    </td>
                    </tr>
                ) : (
                    filtered.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500 font-mono">{log.date}</td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 font-medium">{log.email}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{log.action}</td>
                        <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            log.result === '성공'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        }`}>
                            {log.result}
                        </span>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        )}

        </div>
    )
    }