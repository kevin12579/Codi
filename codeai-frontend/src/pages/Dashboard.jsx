    import { GitFork, CheckCircle2, Activity, XCircle } from 'lucide-react';
    import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

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

    export default function Dashboard({ pipelines = [], stats = null, onSelectPipeline }) {
    const safePipelines = Array.isArray(pipelines) ? pipelines : []

    // stats API 데이터 사용 (없으면 0)
    const totalCount = stats?.totalExecutions ?? 0
    const successRate = stats?.successRate ?? 0
    const failedCount = stats?.failedCount ?? 0
    const inProgressCount = stats?.inProgressCount ?? 0

    const statusBadgeClass = (status) => {
    const s = status?.toUpperCase()
    if (s === 'SUCCESS') return 'bg-[#e8f7ee] text-[#22c55e] font-semibold'
    if (s === 'RUNNING')  return 'bg-[#e6f0ff] text-[#0066ff] font-semibold'
    if (s === 'FAILED')  return 'bg-[#fee2e2] text-[#ef4444] font-semibold'
    return 'bg-[#f1f5f9] text-slate-600'  // PENDING 포함 나머지
    }

    const dotClass = (status) => {
    const s = status?.toUpperCase()
    if (s === 'SUCCESS') return 'bg-[#22c55e]'
    if (s === 'RUNNING')  return 'bg-[#0066ff]'
    if (s === 'FAILED')  return 'bg-[#ef4444]'
    return 'bg-slate-400'  // PENDING
    }

    return (
        <div className="space-y-8">
        <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">대시보드</h1>
            <p className="text-sm text-slate-500">CI/CD 파이프라인 성능 개요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">전체 파이프라인</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e6f0ff] flex items-center justify-center text-[#0066ff]">
                <GitFork size={18} />
                </div>
            </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">성공률</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{successRate}%</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e8f7ee] flex items-center justify-center text-[#22c55e]">
                <CheckCircle2 size={18} />
                </div>
            </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">실행 중</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{inProgressCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e6f0ff] flex items-center justify-center text-[#0066ff]">
                <Activity size={18} />
                </div>
            </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">오늘 실패</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{failedCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ef4444]">
                <XCircle size={18} />
                </div>
            </div>
            </div>
        </div>

        {/* 일별 실행 차트 */}
        {stats?.dailyStats?.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#0f172a]">일별 파이프라인 실행 현황</h2>
            <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="success" name="성공" stroke="#22c55e" strokeWidth={2} fill="url(#colorSuccess)" />
                <Area type="monotone" dataKey="failed" name="실패" stroke="#ef4444" strokeWidth={2} fill="url(#colorFailed)" />
            </AreaChart>
            </ResponsiveContainer>
        </div>
        )}

        {/* 테이블 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#0f172a]">최근 파이프라인 실행</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-4">파이프라인 ID</th>
                    <th className="py-4 px-4">저장소</th>
                    <th className="py-4 px-4">PR</th>
                    <th className="py-4 px-4 text-center">상태</th>
                    <th className="py-4 px-4">소요 시간</th>
                    <th className="py-4 px-4">실행 시각</th>
                    <th className="py-4 px-4">작성자</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                {safePipelines.length > 0 ? (
                    safePipelines.map((pipe) => (
                    <tr
                        key={pipe.id}
                        onClick={() => onSelectPipeline(pipe.id)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                        <td className="py-4 px-4">
                        <span className="text-xs font-mono font-bold text-[#0066ff]">{pipe.id}</span>
                        </td>
                        <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-slate-800">
                            <GitFork size={14} className="text-slate-400" />
                            <span>{pipe.repositoryFullName}</span>
                        </div>
                        </td>
                        <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200/50 rounded-lg text-[11px] font-mono font-medium text-slate-600">
                            {pipe.prNumber ? `#${pipe.prNumber}` : '-'}
                        </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center space-x-1.5 ${statusBadgeClass(pipe.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass(pipe.status)}`} />
                            <span>{pipe.status}</span>
                        </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-500 font-mono">
                        {formatDuration(pipe.durationSeconds)}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-400 font-medium">
                        {formatDate(pipe.startedAt)}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                        {pipe.prAuthor || '-'}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                        데이터를 불러오는 중...
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    )
    }