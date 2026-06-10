import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'


import { INITIAL_PIPELINES } from './mockData'
// 나중: API 호출용 데이터 페처 사용 (이 파일만 바꾸면 끝!)
// import { getPipelines } from './api/pipelineService';


import Dashboard from './pages/Dashboard'
import PipelineDetail from './pages/PipelineDetail'
import PipelineList from './pages/PipelineList'
import Settings from './pages/settings/Settings'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isPipelineOpen, setIsPipelineOpen] = useState(false) // 아코디언 상태 추가
  const [pipelines] = useState(INITIAL_PIPELINES)
  const [selectedPipelineId, setSelectedPipelineId] = useState(null)

  /* 전체 파이프라인 목록 -> 코드별 상세 페이지 이동 */
  const handleSelectPipeline = (id) => {
  console.log("선택된 ID:", id); 
  setSelectedPipelineId(id);
  setActiveTab('pipeline-detail');
}

  const currentPipeline = pipelines.find(p => String(p.id) === String(selectedPipelineId)) || pipelines[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex">
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col">
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-6 border-b border-[#f1f5f9] flex items-center cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0066ff] flex items-center justify-center text-white font-bold text-lg shrink-0">C</div>
          <span className="ml-3 font-bold text-lg tracking-tight text-[#0f172a]">Code AI</span>
        </div>

          <nav className="px-4 py-6 space-y-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center ${activeTab === 'dashboard' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              대시보드
            </button>

            {/* 파이프라인 아코디언 */}
            <div>
              <button 
                onClick={() => setIsPipelineOpen(!isPipelineOpen)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between text-slate-600 hover:bg-slate-50"
              >
                <span>파이프라인</span>
                {isPipelineOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isPipelineOpen && (
                <div className="pl-4 mt-1 space-y-1">
                  <button onClick={() => setActiveTab('pipeline-list')} className="w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-[#0066ff] text-left">전체 실행 목록</button>
                  <button onClick={() => setActiveTab('pipeline-detail')} className="w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-[#0066ff] text-left">실행 상세 내역</button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center ${activeTab === 'settings' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              설정
            </button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-[#f1f5f9] flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#0066ff] text-white flex items-center justify-center font-bold text-sm">JD</div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#0f172a] truncate">홍길동</span>
            <span className="text-xs text-slate-400 truncate">hong@example.com</span>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto px-10 py-10 min-h-screen">
        {activeTab === 'dashboard' && <Dashboard pipelines={pipelines} onSelectPipeline={handleSelectPipeline} />}
        {activeTab === 'pipeline-list' && <PipelineList pipelines={pipelines} onSelectPipeline={handleSelectPipeline} />}
        {activeTab === 'pipeline-detail' && (
          <PipelineDetail
            pipeline={currentPipeline}
            allPipelines={pipelines}
            onSelectPipeline={(id) => setSelectedPipelineId(id)}
            onBack={() => setActiveTab('pipeline-list')}
          />
        )}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  )
}