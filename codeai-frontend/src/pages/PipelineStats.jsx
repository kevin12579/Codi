import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
            timeZone: "Asia/Seoul", // 이 부분 추가
        });
    };

    export default function PipelineStats() {
    const [stats, setStats] = useState(null)
    const [period, setPeriod] = useState('7d')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        apiClient.get(`/pipelines/stats?period=${period}`)
        .then(res => {
            if (res.data.success) setStats(res.data.data)
            else setError(res.data.error?.message || '불러오기 실패')
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }, [period])

    return (
        <div className="space-y-6">
        <div className="grid grid-cols-2 items-end mb-2">
            <div className="space-y-1">
            <div className="flex items-center gap-2">
                <span className="text-xl">✦</span>
                <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">파이프라인 통계</h1>
            </div>
            </div>
            <div className="flex justify-end gap-2">
            {['7d', '30d', '90d'].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    period === p
                    ? 'bg-[#0066ff] text-white border-[#0066ff]'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-[#0066ff] hover:text-[#0066ff]'
                }`}>
                {p === '7d' ? '7일' : p === '30d' ? '30일' : '90일'}
                </button>
            ))}
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
            {error}
            </div>
        )}
        {loading && (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">불러오는 중...</div>
        )}

        {!loading && stats && (
            <>
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">전체 실행</p>
                <p className="text-3xl font-black text-[#0f172a] dark:text-white">{stats.totalExecutions}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">성공률</p>
                <p className="text-3xl font-black text-emerald-500">{stats.successRate}%</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">성공</p>
                <p className="text-3xl font-black text-[#0066ff]">{stats.successCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">실패</p>
                <p className="text-3xl font-black text-rose-500">{stats.failedCount}</p>
                </div>
            </div>

            {/* 바 차트 */}
            <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {period === '7d' ? '최근 7일 실행 현황' : period === '30d' ? '최근 30일 실행 현황' : '최근 90일 실행 현황'}
                </h3>
                <span className="text-xs text-slate-400">평균 소요시간 {Math.round(stats.avgDurationSeconds / 60)}분</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={period === '7d' ? 32 : period === '30d' ? 14 : 8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                    cursor={false} // 호버 배경 제거
                    contentStyle={{ 
                        fontSize: 12, 
                        borderRadius: 8, 
                        border: '1px solid #e2e8f0', 
                        backgroundColor: 'var(--tooltip-bg, #fff)', 
                        color: 'var(--tooltip-color, #0f172a)' 
                    }}
                    labelFormatter={formatDate}
                    />
                    <Bar dataKey="success" name="성공" fill="#0066ff" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="failed" name="실패" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>

            {/* 파이 차트 */}
            <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">AI 엔진별 사용 현황</h3>
                {stats.engineBreakdown && Object.keys(stats.engineBreakdown).length > 0 ? (
                <div className="flex items-center justify-center gap-8">
                    <div className="flex-shrink-0">
                    <PieChart width={160} height={160}>
                        <Pie
                        data={Object.entries(stats.engineBreakdown).map(([engine, count]) => ({ name: engine, value: count }))}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={70}
                        dataKey="value"
                        >
                        {Object.keys(stats.engineBreakdown).map((_, i) => (
                            <Cell key={i} fill={['#0066ff', '#f43f5e', '#10b981'][i % 3]} />
                        ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    </PieChart>
                    </div>

                    <div className="flex flex-col gap-2">
                    {(() => {
                        const total = Object.values(stats.engineBreakdown).reduce((a, b) => a + b, 0)
                        return Object.entries(stats.engineBreakdown).map(([engine, count], i) => {
                        const percent = ((count / total) * 100).toFixed(0)
                        return (
                            <div key={engine} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                                style={{ backgroundColor: ['#0066ff', '#f43f5e', '#10b981'][i % 3] }} />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{engine}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{count}회</span>
                                <span className="text-xs text-slate-400">{percent}%</span>
                            </div>
                            </div>
                        )
                        })
                    })()}
                    </div>
                </div>
                ) : (
                <p className="text-sm text-slate-400 text-center py-8">엔진 데이터 없음</p>
                )}
            </div>
            </>
        )}
        </div>
    )
    }