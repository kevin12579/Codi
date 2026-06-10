import { useState } from 'react'
import { Search, RefreshCcw } from 'lucide-react'

export default function PipelineList({ pipelines, onSelectPipeline }) {
    const [searchTerm, setSearchTerm] = useState('')
    // 어떤 파이프라인이 회전 중인지 ID로 관리
    const [rotatingId, setRotatingId] = useState(null);

    // 개별 재실행 로직
    const handleRerun = async (id) => {
        setRotatingId(id); // 회전 시작
        
        // 실제 API 호출 대신 1초 대기 (서버 흉내)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setRotatingId(null); // 회전 종료
        alert(`파이프라인 ${id} 재실행 완료!`);
    };

    // 검색 필터링 로직
    const filtered = pipelines.filter(p => 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.repo.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* 상단 헤더 영역 (제목만 남기고 버튼 제거) */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">전체 파이프라인</h2>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text"
                        placeholder="ID 또는 저장소 검색..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0066ff] w-64"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 테이블 영역 */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-[#e2e8f0]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">저장소</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">상태</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">브랜치</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((p) => (
                            <tr 
                                key={p.id} 
                                className="group hover:bg-slate-50 transition-colors"
                            >
                                {/* ID 영역: 클릭 시 상세 이동 */}
                                <td 
                                    onClick={() => onSelectPipeline(p.id)} 
                                    className="px-6 py-4 cursor-pointer font-bold text-slate-900 group-hover:text-[#0066ff] transition-all font-mono"
                                >
                                    {p.id}
                                </td>
                                
                                {/* 저장소 영역: 클릭 시 상세 이동 */}
                                <td 
                                    onClick={() => onSelectPipeline(p.id)} 
                                    className="px-6 py-4 cursor-pointer text-sm text-slate-600 group-hover:text-[#0066ff] transition-colors"
                                >
                                    {p.repo}
                                </td>
                                
                                {/* 상태 영역 */}
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                
                                {/* 브랜치 영역 */}
                                <td className="px-6 py-4 text-xs text-slate-500 font-mono">{p.branch}</td>
                                
                                {/* 재실행 아이콘 */}
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            handleRerun(p.id);
                                        }}
                                        className="p-2 text-slate-400 hover:text-[#0066ff] transition-all rounded-full hover:bg-blue-50"
                                        title="재실행"
                                    >
                                        <RefreshCcw 
                                            size={16} 
                                            className={rotatingId === p.id ? "animate-spin" : ""} 
                                        />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}