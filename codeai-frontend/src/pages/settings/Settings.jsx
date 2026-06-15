import { useState, useEffect } from 'react'
import { Check, Eye, EyeOff, Send } from 'lucide-react'

const formatDate = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleString('ko-KR')
}

export default function Settings() {

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

  // ─── GET /api/settings─────────────────────────────────────
  useEffect(() => {
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
}, [])

  // ─── PUT /api/settings/github ─────────────────────────────
  const saveGithub = async () => {
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

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">시스템 설정</h1>
        <p className="text-sm text-slate-500">CI/CD 플랫폼 연동 및 AI 오딧 파라미터 관리</p>
      </div>

      <hr />

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

      </div>
    </div>
  )
}