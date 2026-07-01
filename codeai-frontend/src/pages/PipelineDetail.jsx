import { useState, useEffect } from 'react'
import { ArrowLeft, GitFork, User, Calendar, Clock, CheckCircle2, XCircle, Bell, Copy, Check, Terminal, AlertTriangle, ShieldCheck, Activity, Rocket } from 'lucide-react'
import { formatDate } from '../lib/formatDate'

// 환경변수 기반 API base URL 조립 (이 파일의 기존 fetch 패턴과 동일)
const resolveApiBaseUrl = () => {
  const apiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim()
  const cleanUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
  return apiUrl ? cleanUrl : '/api'
}

const isAdminUser = () => {
  try {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return false
    return String(JSON.parse(raw)?.role || 'USER').toUpperCase() === 'ADMIN'
  } catch {
    return false
  }
}


const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}

export default function PipelineDetail({ pipeline, allPipelines, onSelectPipeline, onBack }) {
  const [activeTab, setActiveTab] = useState('review')
  const [copiedId, setCopiedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [currentStatus, setCurrentStatus] = useState(pipeline.status)
  const [deploying, setDeploying] = useState(false)
  const [deployMsg, setDeployMsg] = useState(null)

  useEffect(() => { setCurrentStatus(pipeline.status) }, [pipeline.status])

  // v0.9(D10): 배포 후보 승인 → POST /api/pipelines/{id}/deploy (ADMIN)
  const approveDeploy = async () => {
    if (deploying) return
    setDeploying(true)
    setDeployMsg(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${resolveApiBaseUrl()}/pipelines/${pipeline.id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result?.success) {
        setCurrentStatus('SUCCESS')
        setDeployMsg({ ok: true, text: result.message || '배포를 트리거했습니다.' })
      } else {
        setDeployMsg({ ok: false, text: result?.error?.message || '배포 승인에 실패했습니다.' })
      }
    } catch (err) {
      setDeployMsg({ ok: false, text: '배포 승인 요청 중 오류가 발생했습니다.' })
    } finally {
      setDeploying(false)
    }
  }

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const savedToken = localStorage.getItem("authToken")
        
        // 🔥 환경변수 주소 조립 및 정제
        const apiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
        const cleanUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
        const finalBaseUrl = apiUrl ? cleanUrl : '/api';

        // 🔥 finalBaseUrl을 사용하도록 주소 변경 및 ngrok 경고 패스 헤더 추가
        const response = await fetch(`${finalBaseUrl}/pipelines/${pipeline.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`,
            'ngrok-skip-browser-warning': 'true' // ngrok 경고 패스 헤더 추가
          }
        })
        const result = await response.json()
        setDetail(result.data)
      } catch (err) {
        console.error("상세 조회 실패:", err)
      }
    }
    fetchDetail()
  }, [pipeline.id])

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const statusClass = (status) => {
    const s = status?.toUpperCase()
    if (s === 'SUCCESS') return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    if (s === 'FAILED') return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
    if (s === 'DEPLOY_CANDIDATE') return 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
    return 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  }

  const severityBadgeClass = (severity) => {
    const s = severity?.toUpperCase()
    if (s === 'HIGH') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 font-extrabold px-2.5 py-0.5 rounded text-[11px]'
    if (s === 'MEDIUM') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-extrabold px-2.5 py-0.5 rounded text-[11px]'
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 font-extrabold px-2.5 py-0.5 rounded text-[11px]'
  }

  return (
    <div className="w-full space-y-6 animate-fade-in text-left">

      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-bold cursor-pointer"
        >
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </button>
        <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider bg-slate-50 dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-600">
          ID: {pipeline.id}
        </span>
      </div>

      {/* 헤더 카드 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md font-black border border-slate-200 dark:border-slate-600">
              #{pipeline.prNumber || '0'}
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
              {pipeline.prTitle || '제목 없음'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide ${statusClass(currentStatus)}`}>
              {currentStatus}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pl-0.5">
            <GitFork size={14} className="text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300 font-mono">{pipeline.repositoryFullName || '레포지토리 정보 없음'}</span>
          </div>
        </div>

        {/* v0.9(D10): 배포 후보 → ADMIN 승인 게이트 */}
        {currentStatus?.toUpperCase() === 'DEPLOY_CANDIDATE' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-2.5">
              <Rocket size={18} className="text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">배포 후보 — 관리자 승인 대기</p>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 font-semibold mt-0.5">
                  HIGH 0건·테스트 통과로 배포 조건을 충족했습니다. 승인 시 GitHub Actions 배포가 트리거됩니다.
                </p>
              </div>
            </div>
            {isAdminUser() ? (
              <button
                onClick={approveDeploy}
                disabled={deploying}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-black transition-all cursor-pointer"
              >
                <Rocket size={15} /> {deploying ? '승인 처리 중…' : '배포 승인'}
              </button>
            ) : (
              <span className="shrink-0 text-xs font-bold text-indigo-400">관리자(ADMIN)만 승인할 수 있습니다</span>
            )}
          </div>
        )}

        {deployMsg && (
          <div className={`text-xs font-bold px-4 py-2.5 rounded-xl border ${deployMsg.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>
            {deployMsg.text}
          </div>
        )}

        {/* 메타 정보 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          {[
            { icon: User, label: '작성자', value: pipeline.prAuthor || '-' },
            { icon: Calendar, label: '시작 일시', value: formatDate(pipeline.startedAt) },
            { icon: Clock, label: '종료 일시', value: pipeline.completedAt ? formatDate(pipeline.completedAt) : '진행 중' },
            { icon: Terminal, label: '소요 시간', value: pipeline.startedAt && pipeline.completedAt ? formatDuration(Math.floor((new Date(pipeline.completedAt) - new Date(pipeline.startedAt)) / 1000)) : '-', mono: true },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-600">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`text-xs font-black text-slate-700 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        {[
          { id: 'review', label: 'AI Code Review' },
          { id: 'e2e', label: 'Playwright E2E Test' },
          { id: 'notifications', label: '알림 수신 내역' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-black border-b-2 transition-all cursor-pointer tracking-tight ${
              activeTab === id
                ? 'border-[#0066ff] text-[#0066ff]'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="pt-1 space-y-5">

        {/* AI Code Review */}
        {activeTab === 'review' && (
          <div className="space-y-5">
            {detail?.review?.comments && detail.review.comments.length > 0 ? (
              detail.review.comments.map((comment, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono tracking-tight break-all">{comment.filePath}</h4>
                    </div>
                    <span className={severityBadgeClass(comment.severity)}>{comment.severity || 'LOW'}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed border-l-4 border-[#0066ff]">
                    <p className="font-black text-slate-900 dark:text-white mb-1 flex items-center gap-1 text-[12px]">
                      {detail?.review?.engineId?.toUpperCase() || 'AI'} 피드백
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{comment.content}</p>
                  </div>

                  {comment.suggestion && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[13px] font-bold text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                          <Terminal size={12} /> Suggested Fix
                        </span>
                        <button
                          onClick={() => copyToClipboard(comment.suggestion, idx)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#0066ff] hover:text-blue-800 hover:underline cursor-pointer bg-blue-50/70 dark:bg-blue-900/30 px-2 py-0.5 rounded-md transition-colors"
                        >
                          {copiedId === idx ? <><Check size={20} /> 복사 완료</> : <><Copy size={20} /></>}
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
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm">
                <ShieldCheck size={36} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="font-black text-slate-900 dark:text-white text-sm">심각한 코드 결함 없음</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {detail?.review?.engineId?.toUpperCase() || 'AI'} 가 분석한 특이사항 및 결함 코드가 존재하지 않습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* E2E Test */}
        {activeTab === 'e2e' && (
          <div className="space-y-5">
            {detail?.steps && detail.steps.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/80 dark:bg-slate-700/50 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity size={14} className="text-[#0066ff]" /> Docker Headless 통합 검증 결과
                  </span>
                  <span className="text-[10px] font-mono font-black bg-slate-200/80 dark:bg-slate-600 px-2 rounded text-slate-600 dark:text-slate-300">
                    Playwright Engine
                  </span>
                  {detail?.testRun?.coveragePct != null && (
                    <span className="text-[10px] font-mono font-black bg-emerald-100 dark:bg-emerald-900/40 px-2 rounded text-emerald-700 dark:text-emerald-400">
                      Coverage {detail.testRun.coveragePct}%
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {detail.steps.map((step, idx) => (
                    <div key={idx} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                      <div className="space-y-1 max-w-2xl">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{step.stepType}</p>
                        {step.errorMessage && (
                          <pre className="text-[11px] font-mono text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-800 mt-2 overflow-x-auto leading-relaxed shadow-inner max-w-full">
                            {step.errorMessage}
                          </pre>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">{formatDuration(step.durationSeconds)}</span>
                        {step.status?.toUpperCase() === 'SUCCESS' ? (
                          <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={13} /> SUCCESS
                          </span>
                        ) : step.status?.toUpperCase() === 'SKIPPED' ? (
                          <span className="flex items-center gap-1 text-xs font-black text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                            <Terminal size={13} /> SKIPPED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                            <XCircle size={13} /> FAILED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm">
                <AlertTriangle size={36} className="text-amber-500 mx-auto mb-2" />
                <h4 className="font-black text-slate-900 dark:text-white text-sm">E2E 테스트 기록 없음</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">수집된 Playwright 자동화 테스트 실행 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 알림 수신 내역 */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {detail?.notifications && detail.notifications.length > 0 ? (
              detail.notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                  <div className="flex items-center space-x-3">
                    {notif.channelId?.toLowerCase().includes('slack') ? (
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-500 shrink-0">
                        <Bell size={16} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{notif.channelId || 'Slack 알림'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{notif.status || '성공적으로 연동 메시지 발송'}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-600 shrink-0">
                    {formatDate(notif.sentAt || pipeline.completedAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm">
                <Bell size={36} className="text-slate-300 mx-auto mb-2" />
                <h4 className="font-black text-slate-900 dark:text-white text-sm">알림 발송 내역 없음</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">외부 채널로 트리거된 웹훅 전송 로그가 없습니다.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}