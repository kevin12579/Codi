import { GitFork, CheckCircle2, Activity, XCircle } from 'lucide-react';

export default function Dashboard({ pipelines = [], onSelectPipeline }) {
    // 안전한 데이터 사용을 위해 빈 배열 처리
    const safePipelines = Array.isArray(pipelines) ? pipelines : [];

    // 통계 계산을 안전하게 수행
    const totalCount = safePipelines.length;
    const successCount = safePipelines.filter(p => p.status === 'Success').length;
    const inProgressCount = safePipelines.filter(p => p.status === 'In-Progress').length;
    const failedCount = safePipelines.filter(p => p.status === 'Failed').length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

    const statusBadgeClass = (status) => {
        if (status === 'Success') return 'bg-[#e8f7ee] text-[#22c55e] font-semibold';
        if (status === 'In-Progress') return 'bg-[#e6f0ff] text-[#0066ff] font-semibold';
        if (status === 'Failed') return 'bg-[#fee2e2] text-[#ef4444] font-semibold';
        return 'bg-[#f1f5f9] text-slate-600';
    };

    const dotClass = (status) => {
        if (status === 'Success') return 'bg-[#22c55e]';
        if (status === 'In-Progress') return 'bg-[#0066ff]';
        if (status === 'Failed') return 'bg-[#ef4444]';
        return 'bg-slate-400';
    };

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">대시보드</h1>
                <p className="text-sm text-slate-500">CI/CD 파이프라인 성능 개요</p>
            </div>

            {/* 통계 섹션 */}
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

            {/* 테이블 섹션 */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[#0f172a]">최근 파이프라인 실행</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-4 px-4">파이프라인 ID</th>
                                <th className="py-4 px-4">이름</th>
                                <th className="py-4 px-4">브랜치</th>
                                <th className="py-4 px-4 text-center">상태</th>
                                <th className="py-4 px-4">소요 시간</th>
                                <th className="py-4 px-4">마지막 실행</th>
                                <th className="py-4 px-4 text-center">커밋</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f8fafc]">
                            {safePipelines.map((pipe) => (
                                <tr key={pipe.id} onClick={() => onSelectPipeline(pipe.id)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                    <td className="py-4 px-4">
                                        <span className="text-xs font-mono font-bold text-[#0066ff]">{pipe.id}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-2 text-sm font-medium text-slate-800">
                                            <GitFork size={14} className="text-slate-400" />
                                            <span>{pipe.repo}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="px-2 py-1 bg-slate-100 border border-slate-200/50 rounded-lg text-[11px] font-mono font-medium text-slate-600">
                                            {pipe.branch}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center space-x-1.5 ${statusBadgeClass(pipe.status)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass(pipe.status)}`} />
                                            <span>{pipe.status}</span>
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-xs font-medium text-slate-500 font-mono">{pipe.timing}</td>
                                    <td className="py-4 px-4 text-xs text-slate-400 font-medium">{pipe.triggered}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[11.5px] font-mono text-slate-500 font-semibold">
                                            {pipe.commit}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}