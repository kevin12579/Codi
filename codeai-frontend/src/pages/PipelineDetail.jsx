import { useState } from 'react'
import { ArrowLeft, GitFork, User, Calendar, Clock, CheckCircle2, XCircle, Bell, Copy, Check, Terminal } from 'lucide-react'

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

const calcDuration = (startedAt, completedAt) => {
  if (!startedAt || !completedAt) return '-'
  const diff = Math.floor((new Date(completedAt) - new Date(startedAt)) / 1000)
  return formatDuration(diff)
}

export default function PipelineDetail({ pipeline, allPipelines, onSelectPipeline, onBack }) {
  const [activeTab, setActiveTab] = useState('review')
  const [copiedId, setCopiedId] = useState(null)

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const statusClass = (status) => {
    const s = status?.toUpperCase()
    if (s === 'SUCCESS') return 'bg-[#e8f7ee] text-[#22c55e]'
    if (s === 'FAILED')  return 'bg-[#fee2e2] text-[#ef4444]'
    if (s === 'RUNNING') return 'bg-[#e6f0ff] text-[#0066ff]'
    return 'bg-[#f1f5f9] text-slate-500'
  }

  // ─── API 필드 ────────────────────────────────────────────────
  const duration = calcDuration(pipeline.startedAt, pipeline.completedAt)

  const timelineSteps = (pipeline.steps || []).map(s => ({
    name: s.stepType,
    status: s.status,
    duration: formatDuration(s.durationSeconds),
  }))

  const reviewComments = (pipeline.review?.comments || []).map((c, idx) => ({
    id: idx,
    severity: c.severity?.toLowerCase() || 'medium',
    line: c.lineNumber,
    title: c.filePath ? `${c.filePath} · Line ${c.lineNumber}` : `Line ${c.lineNumber}`,
    description: c.content,
    suggestion: c.suggestion,
  }))

  const testRun = pipeline.testRun || {}
  const totalTests = testRun.totalTests ?? 0
  const passedTests = testRun.passed ?? 0
  const failedTests = testRun.failed ?? 0
  const coverage = testRun.coveragePct ?? 0

  const notifications = (pipeline.notifications || []).map(n => ({
    channel: n.channel,
    status: n.status,
    time: formatDate(n.sentAt),
    isFail: n.status === 'FAILED',
    isSlack: n.channel === 'SLACK',
    isGithub: n.channel === 'GITHUB',
  }))

  // ─── 타임라인 스텝 스타일 ────────────────────────────────────
  const stepDot = (status) => {
    const s = status?.toUpperCase()
    if (s === 'SUCCESS') return (
      <div className="w-[14px] h-[14px] rounded-full bg-[#e8f7ee] border border-[#22c55e] flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
      </div>
    )
    if (s === 'FAILED') return (
      <div className="w-[14px] h-[14px] rounded-full bg-[#fee2e2] border border-[#ef4444] flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
      </div>
    )
    if (s === 'RUNNING') return (
      <div className="w-[14px] h-[14px] rounded-full bg-[#e6f0ff] border border-[#0066ff] flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-ping" />
      </div>
    )
    return <div className="w-[14px] h-[14px] rounded-full bg-slate-100 border border-slate-300" />
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div className="space-y-2">
          <button onClick={onBack} className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
            <ArrowLeft size={30} />
          </button>
          <p></p><br />
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">{pipeline.id}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass(pipeline.status)}`}>
              {pipeline.status}
            </span>
            <select
              value={pipeline.id}
              onChange={(e) => onSelectPipeline(e.target.value)}
              className="ml-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0066ff] text-slate-600 cursor-pointer"
            >
              {allPipelines.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.status}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm font-semibold text-slate-400">{pipeline.repositoryFullName}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 bg-white px-5 py-3 border border-[#e2e8f0] rounded-2xl text-xs font-medium text-slate-600">
          <div className="flex items-center space-x-1.5">
            <GitFork size={13} className="text-slate-400" />
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{pipeline.headSha}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <User size={13} className="text-slate-400" />
            <span>{pipeline.prAuthor || '-'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span>{formatDate(pipeline.startedAt)}</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold text-slate-700">
            <Clock size={13} className="text-[#0066ff]" />
            <span>소요 시간: {duration}</span>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 타임라인 */}
        <section className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-wider mb-6">파이프라인 타임라인</h3>
            <div className="relative pl-6 space-y-8">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-100 z-0" />
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex flex-col space-y-1">
                  <div className="absolute -left-[25px] top-0.5 w-[14px] h-[14px] rounded-full flex items-center justify-center bg-white">
                    {stepDot(step.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{step.name}</span>
                    <span className="text-xs font-mono text-slate-400">{step.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 탭 영역 */}
        <section className="lg:col-span-7 space-y-4">
          <div className="bg-[#f1f5f9] p-1.5 rounded-2xl flex border border-[#e2e8f0]/40">
            {['review', 'tests', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab === 'review' ? 'AI 리뷰 코멘트' : tab === 'tests' ? '테스트 결과' : '알림 내역'}
              </button>
            ))}
          </div>

          {/* AI 리뷰 탭 */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              {reviewComments.length > 0 ? (
                reviewComments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-[#fef08a] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-[#fef08a]/40 text-[#a16207] text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-[#fef08a]">
                            {comment.severity.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">line:{comment.line}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug mt-1">{comment.title}</h4>
                      </div>
                      <button
                        onClick={() => copyToClipboard(comment.suggestion, comment.id)}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                      >
                        {copiedId === comment.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">{comment.description}</p>
                    <div className="bg-[#f8fafc] border border-slate-200/60 rounded-xl p-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
                        <span>해결 지침 및 수정 코드</span>
                        <span>모범 구문 예시</span>
                      </div>
                      <pre className="text-xs font-mono text-[#0066ff] whitespace-pre overflow-x-auto leading-relaxed p-1.5">
                        {comment.suggestion}
                      </pre>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="mx-auto text-emerald-500" size={32} />
                  <h4 className="font-bold text-slate-900 text-sm">지정된 코드 결함 없음</h4>
                </div>
              )}
              {pipeline.codeSnippet && (
                <div className="bg-slate-950 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/10 pb-2">
                    <span className="flex items-center space-x-2 text-white">
                      <Terminal size={13} className="text-[#0066ff]" />
                      <span>소스코드 리스팅</span>
                    </span>
                    <span>{pipeline.id} Target File</span>
                  </div>
                  <pre className="text-[11.5px] font-mono text-[#f8fafc] overflow-x-auto leading-relaxed whitespace-pre">
                    {pipeline.codeSnippet.split('\n').map((line, idx) => (
                      <div key={idx} className="flex hover:bg-white/5 pr-2">
                        <span className="w-8 opacity-30 select-none text-right pr-3 shrink-0">{idx + 1}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 테스트 결과 탭 */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                  <h4 className="text-sm font-black text-slate-900">테스트 결과</h4>
                  <span className="text-xs font-mono font-medium text-slate-400">총 {totalTests}건</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                      <span>통과</span>
                    </span>
                    <h5 className="text-2xl font-black text-slate-900 font-mono mt-1">{passedTests}</h5>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      <span>실패</span>
                    </span>
                    <h5 className="text-2xl font-black text-slate-900 font-mono mt-1">{failedTests}</h5>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                      <span>건너뜀</span>
                    </span>
                    <h5 className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {totalTests - passedTests - failedTests}
                    </h5>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#0f172a]">전체 테스트 커버리지</h4>
                  <p className="text-xs text-slate-400">코드라인 기준 적용 분량 비율</p>
                </div>
                <div className="flex items-center space-x-3 bg-[#e6f0ff]/50 px-4 py-2.5 rounded-2xl">
                  <span className="font-mono text-lg font-black text-[#0066ff]">{coverage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 알림 내역 탭 */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <div key={idx} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      {notif.isFail ? (
                        <div className="w-9 h-9 rounded-full bg-red-100/80 flex items-center justify-center text-red-500 shrink-0">
                          <XCircle size={16} />
                        </div>
                      ) : notif.isGithub ? (
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <Bell size={16} />
                        </div>
                      ) : notif.isSlack ? (
                        <div className="w-9 h-9 rounded-full bg-blue-100/80 flex items-center justify-center text-blue-500 shrink-0">
                          <Bell size={16} />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-green-100/80 flex items-center justify-center text-green-500 shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900">{notif.channel}</h4>
                        <p className="text-xs text-slate-500">{notif.status}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-400 shrink-0 mt-0.5">{notif.time}</span>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center text-slate-500">
                  <h4 className="font-bold text-slate-900 text-sm">알림 내역 없음</h4>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}