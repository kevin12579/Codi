    import { useState } from 'react';
    import ConnectorOverview from './ConnectorOverview';
    // 나머지 import들...

    export default function ConnectorMain() {
    const [subTab, setSubTab] = useState('overview');

    return (
        <div>
        <h1 className="text-2xl font-bold mb-6">커넥터 설정</h1>
        
        {/* 탭 버튼 영역 */}
        <div className="flex gap-4 mb-6 border-b">
            {['overview', 'vcs', 'ai'].map((tab) => (
            <button 
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`pb-2 capitalize ${subTab === tab ? 'border-b-2 border-[#0066ff] text-[#0066ff]' : 'text-slate-500'}`}
            >
                {tab === 'overview' ? '개요' : tab.toUpperCase()}
            </button>
            ))}
        </div>

        {/* 컨텐츠 렌더링 (비어있는 경우 '준비 중' 표시) */}
        <div className="mt-4">
            {subTab === 'overview' && <ConnectorOverview />}
            {subTab === 'vcs' && <div className="text-slate-400">VCS 설정 준비 중...</div>}
            {subTab === 'ai' && <div className="text-slate-400">AI 엔진 설정 준비 중...</div>}
        </div>
        </div>
    );
    }