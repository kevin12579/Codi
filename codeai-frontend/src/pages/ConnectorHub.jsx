import { useState, useEffect, useCallback } from 'react'
import { Bot, Bell, Lock, RefreshCw, Check, Loader2, KeyRound, Zap } from 'lucide-react'
import { getConnectorsOverview, updateConnectorCategory, testConnectorCategory } from '../api/connectors'

// 카테고리별 표시 메타
const AI_ICON = Bot
const CATEGORY_LABEL = { ai: 'AI 리뷰 엔진', notify: '알림 채널', vcs: 'VCS', test: '테스트', deploy: '배포' }
const FIXED_META = {
  vcs: { label: 'VCS', desc: '소스 연동' },
  test: { label: '테스트', desc: 'E2E 러너' },
  deploy: { label: '배포', desc: '배포 제공자' },
}

const StatusBadge = ({ state }) => {
  const map = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    connected: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    empty: 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-700 dark:text-slate-500 dark:border-slate-600',
  }
  const label = { active: '활성', connected: '연결됨', empty: '미설정' }[state]
  return <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${map[state]}`}>{label}</span>
}

const providerState = (p, activeId) => (p.id === activeId ? 'active' : p.configured ? 'connected' : 'empty')

export default function ConnectorHub() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // AI 카드 상태
  const [selectedAi, setSelectedAi] = useState('')
  const [aiKey, setAiKey] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState(null)
  const [aiTest, setAiTest] = useState(null)

  // 알림 카드 상태
  const [selectedNotify, setSelectedNotify] = useState('')
  const [notifyUrl, setNotifyUrl] = useState('')
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await getConnectorsOverview()
      if (res?.success) {
        setData(res.data)
        setError(null)
        setSelectedAi((prev) => prev || res.data?.ai?.active || '')
        setSelectedNotify((prev) => prev || res.data?.notify?.active || '')
      } else {
        setError(res?.error?.message || '커넥터 조회 실패')
      }
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const saveAi = async () => {
    if (!selectedAi || aiBusy) return
    setAiBusy(true); setAiMsg(null); setAiTest(null)
    try {
      const config = aiKey.trim() ? { [selectedAi]: { apiKey: aiKey.trim() } } : {}
      const res = await updateConnectorCategory('ai', { activeProviders: [selectedAi], config })
      if (res?.success) {
        setAiMsg({ ok: true, text: `${selectedAi} 엔진으로 설정되었습니다.` })
        setAiKey('')
        await load(true)
      } else setAiMsg({ ok: false, text: res?.error?.message || '저장 실패' })
    } catch (e) {
      setAiMsg({ ok: false, text: e?.response?.data?.error?.message || e.message })
    } finally { setAiBusy(false) }
  }

  const testAi = async () => {
    if (aiBusy) return
    setAiBusy(true); setAiTest(null); setAiMsg(null)
    try {
      const res = await testConnectorCategory('ai')
      if (res?.success) setAiTest({ ok: true, text: `${res.data.engine} · ${res.data.latencyMs}ms — ${res.data.sampleReview}` })
      else setAiTest({ ok: false, text: res?.error?.message || '테스트 실패' })
    } catch (e) {
      setAiTest({ ok: false, text: e?.response?.data?.error?.message || '테스트 실패 (키/쿼터 확인)' })
    } finally { setAiBusy(false) }
  }

  const saveNotify = async () => {
    if (!selectedNotify || notifyBusy) return
    setNotifyBusy(true); setNotifyMsg(null)
    try {
      const config = notifyUrl.trim() ? { [selectedNotify]: { webhookUrl: notifyUrl.trim() } } : {}
      const res = await updateConnectorCategory('notify', { activeProviders: [selectedNotify], config })
      if (res?.success) {
        setNotifyMsg({ ok: true, text: `${selectedNotify} 채널로 설정되었습니다.` })
        setNotifyUrl('')
        await load(true)
      } else setNotifyMsg({ ok: false, text: res?.error?.message || '저장 실패' })
    } catch (e) {
      setNotifyMsg({ ok: false, text: e?.response?.data?.error?.message || e.message })
    } finally { setNotifyBusy(false) }
  }

  const testNotify = async () => {
    if (notifyBusy) return
    setNotifyBusy(true); setNotifyMsg(null)
    try {
      const res = await testConnectorCategory('notify')
      if (res?.success) setNotifyMsg({ ok: true, text: '테스트 메시지를 발송했습니다.' })
      else setNotifyMsg({ ok: false, text: res?.error?.message || '테스트 실패' })
    } catch (e) {
      setNotifyMsg({ ok: false, text: e?.response?.data?.error?.message || '테스트 실패 (Webhook URL 확인)' })
    } finally { setNotifyBusy(false) }
  }

  const ai = data?.ai
  const notify = data?.notify

  return (
    <div className="w-full space-y-6 animate-fade-in text-left">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">✦</span> 커넥터
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI·알림·VCS·테스트·배포 플러그인을 한 곳에서 관리합니다.</p>
        </div>
        <button onClick={() => load()} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-500 hover:text-[#0066ff] hover:border-[#0066ff] transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 새로고침
        </button>
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>}
      {loading && !data && <div className="flex items-center justify-center h-48 text-sm text-slate-400"><Loader2 className="animate-spin mr-2" size={16} />불러오는 중...</div>}

      {data && (
        <>
          {/* AI 리뷰 엔진 카드 */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e6f0ff] dark:bg-blue-900/30 flex items-center justify-center text-[#0066ff]"><AI_ICON size={18} /></div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">AI 리뷰 엔진</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">활성: <span className="text-[#0066ff]">{ai?.available?.find(p => p.id === ai.active)?.name || ai?.active || '-'}</span></span>
            </div>

            <div className="space-y-1.5">
              {ai?.available?.map((p) => {
                const st = providerState(p, ai.active)
                const sel = selectedAi === p.id
                return (
                  <button key={p.id} onClick={() => setSelectedAi(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left cursor-pointer ${sel ? 'border-[#0066ff] bg-blue-50/40 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st === 'active' ? 'bg-emerald-500' : sel ? 'bg-[#0066ff]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-32 shrink-0">{p.name}</span>
                    <span className="flex-1 font-mono text-xs text-slate-400 truncate">{p.keyHint || '키 없음'}</span>
                    <StatusBadge state={st} />
                  </button>
                )
              })}
            </div>

            {/* 선택된 엔진 설정 */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={aiKey} onChange={(e) => setAiKey(e.target.value)}
                    placeholder={`${selectedAi || '엔진'} API 키 입력 (비우면 기존 키 유지)`}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#0066ff]" />
                </div>
                <button onClick={saveAi} disabled={aiBusy || !selectedAi}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black">
                  {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} 저장·활성화
                </button>
                <button onClick={testAi} disabled={aiBusy}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0066ff] hover:text-[#0066ff] text-sm font-bold">
                  <Zap size={14} /> 테스트
                </button>
              </div>
              {aiMsg && <p className={`text-xs font-semibold ${aiMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{aiMsg.text}</p>}
              {aiTest && <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${aiTest.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>{aiTest.text}</p>}
            </div>
          </section>

          {/* 알림 채널 카드 */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500"><Bell size={18} /></div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">알림 채널</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">활성: <span className="text-[#0066ff]">{notify?.available?.find(p => p.id === notify.active)?.name || notify?.active || '-'}</span></span>
            </div>

            <div className="space-y-1.5">
              {notify?.available?.map((p) => {
                const st = providerState(p, notify.active)
                const sel = selectedNotify === p.id
                return (
                  <button key={p.id} onClick={() => setSelectedNotify(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left cursor-pointer ${sel ? 'border-[#0066ff] bg-blue-50/40 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st === 'active' ? 'bg-emerald-500' : sel ? 'bg-[#0066ff]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-32 shrink-0">{p.name}</span>
                    <span className="flex-1 font-mono text-xs text-slate-400 truncate">{p.keyHint || '미설정'}</span>
                    <StatusBadge state={st} />
                  </button>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={notifyUrl} onChange={(e) => setNotifyUrl(e.target.value)}
                  placeholder={`${selectedNotify || '채널'} Webhook URL 입력 (비우면 기존 값 유지)`}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:border-[#0066ff]" />
                <button onClick={saveNotify} disabled={notifyBusy || !selectedNotify}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black">
                  {notifyBusy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} 저장·활성화
                </button>
                <button onClick={testNotify} disabled={notifyBusy}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0066ff] hover:text-[#0066ff] text-sm font-bold">
                  <Zap size={14} /> 테스트
                </button>
              </div>
              {notifyMsg && <p className={`text-xs font-semibold ${notifyMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{notifyMsg.text}</p>}
            </div>
          </section>

          {/* V1 고정 카드 */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500"><Lock size={16} /></div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">V1 고정</h2>
                <p className="text-[11px] text-slate-400 font-semibold">레퍼런스 1종 — 다른 제공자 교체는 V2</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['vcs', 'test', 'deploy'].map((cat) => {
                const prov = data[cat]?.available?.[0]
                return (
                  <div key={cat} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{FIXED_META[cat].label}</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">{prov?.name || '-'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400"><Lock size={11} /> 고정</span>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
