import { useState, useEffect } from 'react'  // ← useEffect 추가
import { ArrowLeft, GitFork, User, Calendar, Clock, CheckCircle2, XCircle, Bell, Copy, Check, Terminal, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'


// ─── 유틸 함수 ────────────────────────────────────────────────
const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}
  
const formatDate = (isoString) => {
  if (!isoString) return '-';
  
  // 서버 시간(UTC)을 Date 객체로 생성
  const date = new Date(isoString);
  
  // 9시간(32,400,000ms)을 강제로 더해서 한국 시간으로 변환
  const kstDate = new Date(date.getTime() + 32400000);
  
  return kstDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function PipelineDetail({ pipeline, allPipelines, onSelectPipeline, onBack }) {
  const [activeTab, setActiveTab] = useState('review')
  const [copiedId, setCopiedId] = useState(null)
  const [detail, setDetail] = useState(null)

  // 2️⃣ useEffect fetchDetail 수정 - result.data를 state에 저장
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const savedToken = localStorage.getItem("authToken")
        const response = await fetch(`/api/pipelines/${pipeline.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          }
        })
        const result = await response.json()
        setDetail(result.data)  // ← 이거 추가
      } catch (err) {
        console.error("상세 조회 실패:", err)
      }
    }
    fetchDetail()
  }, [pipeline.id])
    // ↑↑↑ 여기까지 추가 ↑↑↑


  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const statusClass = (status) => {
    const s = status?.toUpperCase()
    if (s === 'SUCCESS') return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
    if (s === 'FAILED') return 'bg-rose-50 text-rose-600 border border-rose-100'
    return 'bg-blue-50 text-blue-600 border border-blue-100'
  }

  const severityBadgeClass = (severity) => {
    const s = severity?.toUpperCase()
    if (s === 'HIGH') return 'bg-rose-100 text-rose-700 font-extrabold px-2.5 py-0.5 rounded text-[11px]'
    if (s === 'MEDIUM') return 'bg-amber-100 text-amber-700 font-extrabold px-2.5 py-0.5 rounded text-[11px]'
    return 'bg-slate-100 text-slate-600 font-extrabold px-2.5 py-0.5 rounded text-[11px]'
  }

  return (
    // ✨ 충돌 원인이던 mx-auto와 max-w를 제거하고 기존 컨텍스트 흐름에 맞게 full 너비로 조정
    <div className="w-full space-y-6 animate-fade-in text-left">
      
      {/* 상단 상위 네비게이션바 */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all text-sm font-bold cursor-pointer"
        >
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </button>
        <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
          ID: {pipeline.id}
        </span>
      </div>

      {/* 헤더 섹션 카드 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-black border border-slate-200">
              #{pipeline.prNumber || '0'}
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900 leading-snug">
              {pipeline.prTitle || '제목 없음'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide ${statusClass(pipeline.status)}`}>
              {pipeline.status}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pl-0.5">
            <GitFork size={14} className="text-slate-400" />
            <span className="text-slate-700 font-mono">{pipeline.repositoryFullName || '레포지토리 정보 없음'}</span>
          </div>
        </div>

        {/* 메타 정보 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><User size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">작성자</p>
              <p className="text-xs font-black text-slate-700">{pipeline.prAuthor || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Calendar size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">시작 일시</p>
              <p className="text-xs font-bold text-slate-700">{formatDate(pipeline.startedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Clock size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">종료 일시</p>
              <p className="text-xs font-bold text-slate-700">{pipeline.completedAt ? formatDate(pipeline.completedAt) : '진행 중'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Terminal size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">소요 시간</p>
              <p className="text-xs font-mono font-black text-slate-700">
                {pipeline.startedAt && pipeline.completedAt ? formatDuration(Math.floor((new Date(pipeline.completedAt) - new Date(pipeline.startedAt)) / 1000)) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 컨트롤러 */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2.5 text-sm font-black border-b-2 transition-all cursor-pointer tracking-tight ${
            activeTab === 'review' ? 'border-[#0066ff] text-[#0066ff]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          AI Code Review
        </button>
        <button
          onClick={() => setActiveTab('e2e')}
          className={`px-4 py-2.5 text-sm font-black border-b-2 transition-all cursor-pointer tracking-tight ${
            activeTab === 'e2e' ? 'border-[#0066ff] text-[#0066ff]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Playwright E2E Test
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 text-sm font-black border-b-2 transition-all cursor-pointer tracking-tight ${
            activeTab === 'notifications' ? 'border-[#0066ff] text-[#0066ff]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          알림 수신 내역
        </button>
      </div>

      {/* 탭 컨텐츠 영역 */}
      <div className="pt-1 space-y-5">
        
        {/* 1️⃣ AI Code Review 탭 */}
        {activeTab === 'review' && (
          <div className="space-y-5">
            {detail?.review?.comments && detail.review.comments.length > 0 ? (
              detail.review.comments.map((comment, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:border-slate-300">
                  
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
                      <h4 className="text-sm font-black text-slate-800 font-mono tracking-tight break-all">{comment.filePath}</h4>
                    </div>
                    <span className={severityBadgeClass(comment.severity)}>
                      {comment.severity || 'LOW'}
                    </span>
                  </div>

                  <div className="bg-slate-50 px-4 py-3.5 rounded-xl text-xs font-semibold text-slate-700 leading-relaxed border-l-4 border-[#0066ff]">
                    <p className="font-black text-slate-900 mb-1 flex items-center gap-1 text-[12px]">
                      {detail?.review?.engineId?.toUpperCase() || 'AI'} 피드백
                    </p>
                    <p className="text-slate-600 font-medium">{comment.content}</p>
                  </div>

                  {comment.suggestion && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[13px] font-bold text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                          <Terminal size={12} /> Suggested Fix
                        </span>
                        <button
                          onClick={() => copyToClipboard(comment.suggestion, idx)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#0066ff] hover:text-blue-800 hover:underline cursor-pointer bg-blue-50/70 px-2 py-0.5 rounded-md transition-colors"
                        >
                          {copiedId === idx ? (
                            <><Check size={20} /> 복사 완료</>
                          ) : (
                            <><Copy size={20} /></>
                          )}
                        </button>
                      </div>
                      <pre className="bg-[#0f172a] text-slate-200 px-5 py-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-lg leading-relaxed">
                        <code>{comment.suggestion}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
                <ShieldCheck size={36} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="font-black text-slate-900 text-sm">심각한 코드 결함 없음</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {detail?.review?.engineId?.toUpperCase() || 'AI'} 가 분석한 특이사항 및 결함 코드가 존재하지 않습니다.
                </p>
              </div>
            )}
          </div>
        )}


        {/* 2️⃣ Playwright E2E Test 탭 */}
        {activeTab === 'e2e' && (
          <div className="space-y-5">
            {detail?.steps && detail.steps.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Activity size={14} className="text-[#0066ff]" /> Docker Headless 통합 검증 결과
                  </span>
                  <span className="text-[10px] font-mono font-black bg-slate-200/80 px-2 rounded text-slate-600">
                    Playwright Engine
                  </span>
                  {detail?.testRun?.coveragePct != null && (
                  <span className="text-[10px] font-mono font-black bg-emerald-100 px-2 rounded text-emerald-700">
                    Coverage {detail.testRun.coveragePct}%
                  </span>
)}
                </div>
                <div className="divide-y divide-slate-100">
                  {detail.steps.map((step, idx) => (
                    <div key={idx} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                      <div className="space-y-1 max-w-2xl">
                        <p className="text-sm font-black text-slate-800">{step.stepType}</p>
                        {step.errorMessage && (
                          <pre className="text-[11px] font-mono text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 mt-2 overflow-x-auto leading-relaxed shadow-inner max-w-full">
                            {step.errorMessage}
                          </pre>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{formatDuration(step.durationSeconds)}</span>
                        {step.status?.toUpperCase() === 'SUCCESS' ? (
                          <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 size={13} /> SUCCESS
                          </span>
                        ) : step.status?.toUpperCase() === 'SKIPPED' ? (
                          <span className="flex items-center gap-1 text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            <Terminal size={13} /> SKIPPED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                            <XCircle size={13} /> FAILED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
                <AlertTriangle size={36} className="text-amber-500 mx-auto mb-2" />
                <h4 className="font-black text-slate-900 text-sm">E2E 테스트 기록 없음</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">수집된 Playwright 자동화 테스트 실행 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 3️⃣ 알림 수신 내역 탭 */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {detail?.notifications && detail.notifications.length > 0 ? (
              detail.notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm gap-4 hover:border-slate-300 transition-all">
                  <div className="flex items-center space-x-3">
                    {notif.channelId?.toLowerCase().includes('slack') ? (
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                        <Bell size={16} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-slate-900">{notif.channelId || 'Slack 알림'}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{notif.status || '성공적으로 연동 메시지 발송'}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                    {formatDate(notif.sentAt || pipeline.completedAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
                <Bell size={36} className="text-slate-300 mx-auto mb-2" />
                <h4 className="font-black text-slate-900 text-sm">알림 발송 내역 없음</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">외부 채널로 트리거된 웹훅 전송 로그가 없습니다.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}