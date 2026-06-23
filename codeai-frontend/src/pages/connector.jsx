import { useState, useEffect } from 'react'
import { Check, Eye, EyeOff, Send } from 'lucide-react'
import { isApiEnabled } from '../../api/client'


  const formatDate = (isoString) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleString('ko-KR')
  }


export default function Settings() {
  const apiEnabled = isApiEnabled()

  // ─── Connectors ───────────────────────────────────────────
  const [connectors, setConnectors] = useState([])        // 엔진 목록
  const [activeEngine, setActiveEngine] = useState('')    // 현재 활성 엔진
  const [engineTestResult, setEngineTestResult] = useState(null)  // 테스트 결과
  const [engineTestLoading, setEngineTestLoading] = useState(false)

  // ─── GitHub ───────────────────────────────────────────────
  const [githubConnected, setGithubConnected] = useState(true)
  const [githubWebhookUrl, setGithubWebhookUrl] = useState('https://codeai.example.com/webhook/github')
  const [githubWebhookSecret, setGithubWebhookSecret] = useState('codeai_secret_***')
  const [githubLastConnectedAt, setGithubLastConnectedAt] = useState('2026-06-08T09:00:00')
  const [showGithubSecret, setShowGithubSecret] = useState(false)
  const [githubSaveMsg, setGithubSaveMsg] = useState('')

  // ─── Slack ────────────────────────────────────────────────
  const [slackConnected, setSlackConnected] = useState(true)
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/***')
  const [slackLastTestedAt, setSlackLastTestedAt] = useState('2026-06-08T09:10:00')
  const [slackSaveMsg, setSlackSaveMsg] = useState('')
  const [slackTestMsg, setSlackTestMsg] = useState('')
  const [slackTestLoading, setSlackTestLoading] = useState(false)

  // ─── Claude ───────────────────────────────────────────────
  const [activePromptVersion, setActivePromptVersion] = useState('v3')
  const [maxTokensPerReview, setMaxTokensPerReview] = useState(3000)
  const [claudeSaveMsg, setClaudeSaveMsg] = useState('')

  const applyLocalConnectorFallback = () => {
    setConnectors([
      { id: 'claude', name: 'Claude', configured: true },
      { id: 'openai', name: 'OpenAI', configured: true },
      { id: 'gemini', name: 'Gemini', configured: false },
    ])
    setActiveEngine('claude')
  }

  // ─── GET /api/settings─────────────────────────────────────
  useEffect(() => {
  if (!apiEnabled) return

  fetch('/api/settings')
    .then(res => res.json())
    .then(json => {
      if (!json.success) return
      const { github, slack, claude } = json.data

      setGithubConnected(github.connected)
      setGithubWebhookUrl(github.webhookUrl)
      setGithubWebhookSecret(github.webhookSecret)
      setGithubLastConnectedAt(github.lastConnectedAt)

      setSlackConnected(slack.connected)
      setSlackWebhookUrl(slack.webhookUrl)
      setSlackLastTestedAt(slack.lastTestedAt)

      setActivePromptVersion(claude.activePromptVersion)
      setMaxTokensPerReview(claude.maxTokensPerReview)
    })
    .catch(err => console.error('settings fetch 실패:', err))
  }, [apiEnabled])


  // ─── GET 호출 ─────────────────────────────────────
    useEffect(() => {
      if (!apiEnabled) {
        applyLocalConnectorFallback()
        return
      }

      const savedToken = localStorage.getItem("authToken")
      fetch('/api/connectors/ai', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then(res => res.json())
        .then(json => {
          if (!json.success) {
            applyLocalConnectorFallback()
            return
          }
          setConnectors(json.data.available)   // [{id, name, configured}, ...]
          setActiveEngine(json.data.active)    // "claude"
        })
        .catch(() => applyLocalConnectorFallback())
    }, [apiEnabled])


  // ─── PUT /api/settings/github ─────────────────────────────
  const saveGithub = async () => {
    if (!apiEnabled) {
      setGithubSaveMsg('저장 완료')
      setTimeout(() => setGithubSaveMsg(''), 2000)
      return
    }

    try {
      const res = await fetch('/api/settings/github', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookSecret: githubWebhookSecret }),
      })
      const result = await res.json()
      setGithubSaveMsg(result.success ? '저장 완료' : '저장 실패')
    } catch {
      setGithubSaveMsg('저장 실패')
    } finally {
      setTimeout(() => setGithubSaveMsg(''), 2000)
    }
  }

  // ─── PUT /api/settings/slack ──────────────────────────────
  const saveSlack = async () => {
    if (!apiEnabled) {
      setSlackConnected(Boolean(slackWebhookUrl))
      setSlackSaveMsg('저장 완료')
      setTimeout(() => setSlackSaveMsg(''), 2000)
      return
    }

    try {
      const res = await fetch('/api/settings/slack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: slackWebhookUrl }),
      })
      const result = await res.json()
      if (result.success) setSlackConnected(result.data.connected)
      setSlackSaveMsg(result.success ? '저장 완료' : '저장 실패')
    } catch {
      setSlackSaveMsg('저장 실패')
    } finally {
      setTimeout(() => setSlackSaveMsg(''), 2000)
    }
  }

  // ─── POST /api/settings/slack/test ───────────────────────
  const testSlack = async () => {
    if (!apiEnabled) {
      setSlackTestMsg('테스트 메시지 발송 완료')
      setSlackLastTestedAt(new Date().toISOString())
      setTimeout(() => setSlackTestMsg(''), 3000)
      return
    }

    setSlackTestLoading(true)
    try {
      const res = await fetch('/api/settings/slack/test', { method: 'POST' })
      const result = await res.json()
      setSlackTestMsg(result.success ? '테스트 메시지 발송 완료' : result.error?.message || '발송 실패')
      if (result.success && result.data?.sentAt) setSlackLastTestedAt(result.data.sentAt)
    } catch {
      setSlackTestMsg('발송 실패')
    } finally {
      setSlackTestLoading(false)
      setTimeout(() => setSlackTestMsg(''), 3000)
    }
  }

  // ─── PUT /api/settings/claude ─────────────────────────────
  const saveClaude = async () => {
    if (!apiEnabled) {
      setClaudeSaveMsg('저장 완료')
      setTimeout(() => setClaudeSaveMsg(''), 2000)
      return
    }

    try {
      const res = await fetch('/api/settings/claude', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activePromptVersion, maxTokensPerReview }),
      })
      const result = await res.json()
      setClaudeSaveMsg(result.success ? '저장 완료' : '저장 실패')
    } catch {
      setClaudeSaveMsg('저장 실패')
    } finally {
      setTimeout(() => setClaudeSaveMsg(''), 2000)
    }
  }

  // ─── PUT /api/connectors/ai ───────────────────────────────
  const switchEngine = async (engineId) => {
    if (!apiEnabled) {
      setActiveEngine(engineId)
      return
    }

    const savedToken = localStorage.getItem("authToken")
    try {
      const res = await fetch('/api/connectors/ai', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          activeProviders: [engineId],
          config: {}   // API Key는 일단 빈 값 — 나중에 입력 필드 추가하면 됨
        }),
      })
      const result = await res.json()
      if (result.success) setActiveEngine(result.data.active)
    } catch (err) {
      console.error('엔진 교체 실패:', err)
    }
  }

  // ─── POST /api/connectors/ai/test ────────────────────────
  const testEngine = async () => {
    if (!apiEnabled) {
      setEngineTestResult({ engine: activeEngine || 'claude', latencyMs: Math.floor(Math.random() * 90) + 40 })
      return
    }

    const savedToken = localStorage.getItem("authToken");
    setEngineTestLoading(true);
    setEngineTestResult(null);
    
    try {
      const res = await fetch('/api/connectors/ai/test', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      
      const result = await res.json();

      // 💡 여기에 추가한 에러 처리 로직을 배치하세요
      if (res.status === 502) {
        setEngineTestResult({ error: '연결 실패: API Key를 확인하거나 서버 상태를 점검해주세요.' });
      } else if (!result.success) {
        setEngineTestResult({ error: result.error?.message || '테스트 실패' });
      } else {
        setEngineTestResult(result.data);
      }

    } catch (err) {
      console.error('테스트 중 오류 발생:', err);
      setEngineTestResult({ error: '테스트 요청 중 네트워크 오류가 발생했습니다.' });
    } finally {
      setEngineTestLoading(false);
    }
  };

  return (
      <div className="space-y-6">
        {/* [해결] grid를 사용하여 제목과 상태를 좌우로 완벽하게 분리 */}
        <div className="grid grid-cols-2 items-end mb-2">
            {/* 왼쪽: 제목 영역 */}
            <div className="space-y-1">
            <div className="flex items-center gap-2">
                <span className="text-xl">✦</span>
                <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">시스템 설정</h1>
            </div>
            </div>

            {/* 오른쪽: 상태 뱃지 (밀림 방지) */}
            <div className="flex justify-end">
            <div className="px-3 py-1 bg-[#e6f0ff] border border-[#bfdbfe] rounded-lg text-xs font-bold text-[#0066ff] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
                Ready to Analyze
            </div>
            </div>
        </div>

        <hr className="border-slate-200" />

        {/* AI 엔진 선택 */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">✦ AI 엔진 선택</label>
          <div className="flex gap-2 flex-wrap">
            {connectors.map((engine) => {
              const isActive = engine.id === activeEngine
              return (
                <button
                  key={engine.id}
                  onClick={() => switchEngine(engine.id)}  // ← 클릭 시 엔진 교체
                  disabled={!engine.configured}            // ← configured: false면 비활성
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
                    ${isActive
                      ? 'bg-blue-50 border-[#0066ff] cursor-pointer'
                      : engine.configured
                        ? 'bg-slate-50 border-slate-200 hover:border-[#0066ff] cursor-pointer'
                        : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <span className={`text-xs font-black ${isActive ? 'text-[#0066ff]' : 'text-slate-400'}`}>
                    {engine.name}
                  </span>
                  {isActive
                    ? <span className="text-[10px] bg-[#0066ff] text-white px-1.5 py-0.5 rounded font-bold">Active</span>
                    : !engine.configured
                      ? <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">미설정</span>
                      : null
                  }
                </button>
              )
            })}
          </div>

          {/* 테스트 버튼 + 결과 */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={testEngine}
              disabled={engineTestLoading}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
            >
              {engineTestLoading ? '테스트 중...' : '연결 테스트'}
            </button>

            {/* 테스트 결과 표시 */}
            {engineTestResult && (
              engineTestResult.error
                ? <span className="text-xs font-semibold text-red-500">{engineTestResult.error}</span>
                : <span className="text-xs font-semibold text-emerald-600">
                    ✓ {engineTestResult.engine} · {engineTestResult.latencyMs}ms
                  </span>
            )}
          </div>
        </div>


      <div className="space-y-6">

        {/* SET-001 GitHub */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-001</span>
                <h3 className="text-base font-bold text-slate-900">GitHub 연동</h3>
              </div>
              <p className="text-xs text-slate-400">코드 저장소 Webhook 연동 설정</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
              githubConnected
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}>
              {githubConnected ? '✓ 연결됨' : '미연결'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Webhook URL</label>
              <input
                type="text"
                value={githubWebhookUrl}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">마지막 연결</label>
              <input
                type="text"
                value={formatDate(githubLastConnectedAt)}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Webhook Secret</label>
              <div className="relative">
                <input
                  type={showGithubSecret ? 'text' : 'password'}
                  value={githubWebhookSecret}
                  onChange={(e) => setGithubWebhookSecret(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-800 font-mono focus:outline-none transition-all"
                />
                <button
                  onClick={() => setShowGithubSecret(!showGithubSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showGithubSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            {githubSaveMsg && (
              <span className={`text-xs font-semibold flex items-center gap-1 ${githubSaveMsg.includes('완료') ? 'text-emerald-600' : 'text-red-500'}`}>
                <Check size={12} /> {githubSaveMsg}
              </span>
            )}
            <button
              onClick={saveGithub}
              className="px-4 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              저장
            </button>
          </div>
        </div>

        {/* SET-002 Slack */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-002</span>
                <h3 className="text-base font-bold text-slate-900">Slack 연동</h3>
              </div>
              <p className="text-xs text-slate-400">빌드 결과 알림 Webhook 설정</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
              slackConnected
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}>
              {slackConnected ? '✓ 연결됨' : '미연결'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Webhook URL</label>
              <input
                type="text"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">마지막 테스트</label>
              <input
                type="text"
                value={formatDate(slackLastTestedAt)}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={testSlack}
                disabled={slackTestLoading}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                <Send size={12} />
                {slackTestLoading ? '발송 중...' : '테스트 발송'}
              </button>
              {slackTestMsg && (
                <span className={`text-xs font-semibold ${slackTestMsg.includes('완료') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {slackTestMsg}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {slackSaveMsg && (
                <span className={`text-xs font-semibold flex items-center gap-1 ${slackSaveMsg.includes('완료') ? 'text-emerald-600' : 'text-red-500'}`}>
                  <Check size={12} /> {slackSaveMsg}
                </span>
              )}
              <button
                onClick={saveSlack}
                className="px-4 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                저장
              </button>
            </div>
          </div>
        </div>

        {/* SET-003 Claude */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-003</span>
              <h3 className="text-base font-bold text-slate-900">Claude API 설정</h3>

            </div>
            <p className="text-xs text-slate-400">코드 오딧을 위한 Claude 엔진 파라미터 설정</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">프롬프트 버전</label>
              <select
                value={activePromptVersion}
                onChange={(e) => setActivePromptVersion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-medium focus:outline-none text-slate-700 focus:bg-white focus:border-[#0066ff]"
              >
                <option value="v1">v1</option>
                <option value="v2">v2</option>
                <option value="v3">v3</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">최대 토큰 수</label>
              <input
                type="number"
                value={maxTokensPerReview}
                onChange={(e) => setMaxTokensPerReview(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            {claudeSaveMsg && (
              <span className={`text-xs font-semibold flex items-center gap-1 ${claudeSaveMsg.includes('완료') ? 'text-emerald-600' : 'text-red-500'}`}>
                <Check size={12} /> {claudeSaveMsg}
              </span>
            )}
            <button
              onClick={saveClaude}
              className="px-4 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              저장
            </button>
          </div>
        </div>

        
          {/* SET-004 알림 채널 확장 */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-004</span>
                <h3 className="text-base font-bold text-slate-900">알림 채널 확장</h3>
              </div>
              <p className="text-xs text-slate-400">MCP 기반 멀티 채널 알림 연동 설정</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Slack - 활성 */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-slate-800">Slack</p>
                  <p className="text-[10px] text-slate-400">기본 알림 채널</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded-lg">✓ 활성</span>
              </div>

              {/* Discord - Coming Soon */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-60">
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-slate-500">Discord</p>
                  <p className="text-[10px] text-slate-400">커뮤니티 알림</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">Coming Soon</span>
              </div>

              {/* Teams - Coming Soon */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-60">
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-slate-500">MS Teams</p>
                  <p className="text-[10px] text-slate-400">엔터프라이즈 알림</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">Coming Soon</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              💡 MCP 서버 확장으로 추가 채널을 자유롭게 연동할 수 있습니다.
            </p>
          </div>

      </div>
    </div>
  )
}