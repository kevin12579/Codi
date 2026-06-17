    import { useState, useEffect } from 'react';
    import { GitFork, CheckCircle2, Activity, XCircle, ArrowUp } from 'lucide-react';
    import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

    const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}분 ${s}초`;
    };

    const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('ko-KR');
    };

    export default function Dashboard({ pipelines = [], stats = null, onSelectPipeline }) {
    const isLoading = pipelines.length === 0 && stats === null;
    const safePipelines = Array.isArray(pipelines) ? pipelines : [];

    const totalCount = stats?.totalExecutions ?? 0;
    const successRate = stats?.successRate ?? 0;
    const failedCount = stats?.failedCount ?? 0;
    const inProgressCount = stats?.inProgressCount ?? 0;
    
    
    const [showTopBtn, setShowTopBtn] = useState(false);
        useEffect(() => {
        const handleScroll = () => {
        // 300px 이상 스크롤 시 버튼 표시
        setShowTopBtn(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const statusBadgeClass = (status) => {
        const s = status?.toUpperCase();
        if (s === 'SUCCESS') return 'bg-[#e8f7ee] text-[#22c55e] font-semibold';
        if (s === 'RUNNING') return 'bg-[#e6f0ff] text-[#0066ff] font-semibold';
        if (s === 'FAILED') return 'bg-[#fee2e2] text-[#ef4444] font-semibold';
        return 'bg-[#f1f5f9] text-slate-600';
    };

    const dotClass = (status) => {
        const s = status?.toUpperCase();
        if (s === 'SUCCESS') return 'bg-[#22c55e]';
        if (s === 'RUNNING') return 'bg-[#0066ff]';
        if (s === 'FAILED') return 'bg-[#ef4444]';
        return 'bg-slate-400';
    };

    // ─── 스켈레톤 UI ──────────────────────────────────────────
    if (isLoading) return (
        <div className="space-y-8">
        <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">대시보드</h1>
            <p className="text-sm text-slate-500">CI/CD 파이프라인 성능 개요</p>
        </div>

        {/* 통계 카드 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded-lg w-24" />
                    <div className="h-8 bg-slate-100 rounded-lg w-16" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                </div>
            </div>
            ))}
        </div>

        {/* 차트 스켈레톤 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-4 bg-slate-100 rounded-lg w-48" />
            <div className="h-[220px] bg-slate-100 rounded-xl" />
        </div>

        {/* 테이블 스켈레톤 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="h-4 bg-slate-100 rounded-lg w-36 animate-pulse" />
            <table className="w-full">
            <tbody className="divide-y divide-[#f8fafc]">
                {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded-lg w-8" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded-lg w-36" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded-lg w-12" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded-lg w-16" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded-lg w-28" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded-lg w-20" /></td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );

    

    // ─── 정상 렌더링 ──────────────────────────────────────────
    return (
        <div className="space-y-8">
        <div className="flex items-center justify-between">

            {/* 왼쪽 */}
            <div className="flex items-center gap-3">
                                    <span className="text-xl">✦</span>
                <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">
                    대시보드
                </h1>

                <span className="text-slate-300">•</span>

                <p className="text-sm text-slate-500">
                    CI/CD 파이프라인 성능 개요
                </p>
            </div>

            {/* 오른쪽 */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-slate-600 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    v1.2.4
                </div>

                <a
                    href="https://github.com/kevin12579/Codi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-600"
                    >
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>

                    <span className="text-xs font-bold text-slate-700">
                        1.2k
                    </span>
                </a>
            </div>
        </div>

<hr className="mt-4" />

    <hr></hr>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
            { label: '전체 파이프라인', val: totalCount, color: 'bg-[#e6f0ff]', text: 'text-[#0066ff]', icon: GitFork },
            { label: '성공률', val: `${successRate}%`, color: 'bg-[#e8f7ee]', text: 'text-[#22c55e]', icon: CheckCircle2 },
            { label: '실행 중', val: inProgressCount, color: 'bg-[#e6f0ff]', text: 'text-[#0066ff]', icon: Activity },
            { label: '오늘 실패', val: failedCount, color: 'bg-[#fee2e2]', text: 'text-[#ef4444]', icon: XCircle },
            ].map((item, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">{item.label}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{item.val}</h3>
                </div>
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center ${item.text}`}>
                    <item.icon size={18} />
                </div>
                </div>
            </div>
            ))}
        </div>

        {/* 차트 */}
        {stats?.dailyStats?.length > 0 && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#0f172a]">일별 파이프라인 실행 현황</h2>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} labelStyle={{ fontWeight: 'bold', color: '#0f172a' }} />
                <Area type="monotone" dataKey="success" name="성공" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.1} />
                <Area type="monotone" dataKey="failed" name="실패" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.1} />
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
                    <tr key={pipe.id} onClick={() => onSelectPipeline(pipe.id)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="py-4 px-4"><span className="text-xs font-mono font-bold text-[#0066ff]">{pipe.id}</span></td>
                        <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-slate-800">
                            <GitFork size={14} className="text-slate-400" />
                            <span>{pipe.repositoryFullName}</span>
                        </div>
                        </td>
                        <td className="py-4 px-4"><span className="px-2 py-1 bg-slate-100 border border-slate-200/50 rounded-lg text-[11px] font-mono font-medium text-slate-600">{pipe.prNumber ? `#${pipe.prNumber}` : '-'}</span></td>
                        <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center space-x-1.5 ${statusBadgeClass(pipe.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass(pipe.status)}`} />
                            <span>{pipe.status}</span>
                        </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-500 font-mono">{formatDuration(pipe.durationSeconds)}</td>
                        <td className="py-4 px-4 text-xs text-slate-400 font-medium">{formatDate(pipe.startedAt)}</td>
                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">{pipe.prAuthor || '-'}</td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">데이터가 없습니다.</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* 오픈소스 배너 */}

        <a href="https://github.com/kevin12579/Codi"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-5 py-3 bg-white border border-slate-200 hover:border-[#0066ff] rounded-2xl transition-all group shadow-sm"
        >
        <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-slate-600 group-hover:text-[#0066ff] transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 group-hover:text-[#0066ff] transition-colors">오픈소스 프로젝트</span>
            <span className="text-[10px] font-mono text-slate-400">github.com/kevin12579/Codi</span>
            </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#0066ff] transition-colors">View on GitHub →</span>
        </a>

        {/* TOP 버튼 */}
        {showTopBtn && (
            <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-[#0f172a] text-white rounded-full shadow-lg hover:bg-slate-800 transition-all duration-300 z-50 animate-in fade-in zoom-in"
            aria-label="맨 위로 이동"
            >
            <ArrowUp size={20} />
            </button>
        )}


        </div>
    );
    }