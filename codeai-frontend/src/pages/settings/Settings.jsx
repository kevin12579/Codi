import { useState } from 'react'

import { ShieldCheck, Sliders, Check, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const [strictMode, setStrictMode] = useState(true)
  const [githubRepo, setGithubRepo] = useState('github.com/ruruew2/codi-project')
  const [githubBranch, setGithubBranch] = useState('main')
  const [githubToken, setGithubToken] = useState('ghp_qLx7wK9zN2v8x3M1p8r9S4b5N6_SECRET')
  const [slackUrl, setSlackUrl] = useState(' ')
  const [slackChannel, setSlackChannel] = useState('#codi-alerts')
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(true)
  const [notifyOnFailure, setNotifyOnFailure] = useState(true)
  const [claudeApiKey, setClaudeApiKey] = useState('sk-ant-sid01-KmL9x8Z1pM7v5w3R9q4S8_SECRET_KEY')
  const [claudeModel, setClaudeModel] = useState('claude-3-5-sonnet-20241022')
  const [isClaudeActive, setIsClaudeActive] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false)
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [showClaudeKey, setShowClaudeKey] = useState(false)

  const saveSettings = () => {
    setSaveSuccessMsg(true)
    setTimeout(() => setSaveSuccessMsg(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* 페이지 타이틀 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">설정</h1>
        <p className="text-sm text-slate-500">CI/CD 플랫폼 및 AI 오딧 상세 규격 관리</p>
      </div>

      <hr></hr>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-8">

        {/* GEMINI API KEY 상태 */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-slate-900">GEMINI_API_KEY 상태 점검</h2>
          <p className="text-xs text-slate-500">
            본 애플리케이션 프레임워크는 서버측에{' '}
            <span className="font-bold text-slate-700">GEMINI_API_KEY</span> 환경 변수를 구성 주입받아
            최첨단 인텔리전스인{' '}
            <code className="font-mono text-[#0066ff]">gemini-3.5-flash</code> 모델을 구동합니다.
          </p>
          <div className="flex items-center justify-between bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3">
            <div className="flex items-center space-x-2 text-sm font-medium text-emerald-700">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>컨테이너 프레임워크 바인딩 상태 : 양호</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg">
              서버 보안 전계 활성
            </span>
          </div>
        </div>

        {/* 품질 엄격도 */}
        <div className="border-t border-slate-100 pt-6 space-y-2">
          <h2 className="text-base font-black text-slate-900">품질 엄격도 제어</h2>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">SLA 연계 초강력 품질 게이팅 오딧</p>
              <p className="text-xs text-slate-400">코드 점수 80점 미달 건 발생 시 빌드 결격 경보를 즉각 통지하며 병합 파이프라인 진행을 긴급 정지합니다.</p>
            </div>
            <button
              onClick={() => setStrictMode(!strictMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                strictMode ? 'bg-[#0066ff]' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                strictMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

{/* SET-001 GitHub 연동 */}
<div className="border-t border-slate-100 pt-6 space-y-4">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-001</span>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
          GitHub 연동
        </h3>
      </div>
      <p className="text-xs text-slate-400">코드 저장소 원격 지점 추적 및 배포 파이프라인 자동화</p>
    </div>
    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
      ✓ 활성화됨
    </span>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">저장소 주소 (Repository URL)</label>
      <input
        type="text"
        value={githubRepo}
        onChange={(e) => setGithubRepo(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition-all"
      />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">기준 브랜치 (Target Branch)</label>
      <input
        type="text"
        value={githubBranch}
        onChange={(e) => setGithubBranch(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition-all"
      />
    </div>
    <div className="md:col-span-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">개인 액세스 토큰 (Personal Access Token)</label>
      <div className="relative">
        <input
          type={showGithubToken ? 'text' : 'password'}
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="ghp_...................................."
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-800 font-mono focus:outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setShowGithubToken(!showGithubToken)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showGithubToken ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  </div>
</div>

{/* SET-002 Slack 연동 */}
<div className="border-t border-slate-100 pt-6 space-y-4">
  <div className="space-y-0.5">
    <div className="flex items-center space-x-2">
      <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-002</span>
      <h3 className="text-base font-bold text-slate-900">Slack 연동</h3>
    </div>
    <p className="text-xs text-slate-400">워크스페이스 기반의 오딧 가이드 및 빌드 결과 실시간 피드 링크</p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Webhook URL 주소</label>
      <input
        type="text"
        value={slackUrl}
        onChange={(e) => setSlackUrl(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition-all"
      />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">대상 수신 채널 (Target Channel)</label>
      <input
        type="text"
        value={slackChannel}
        onChange={(e) => setSlackChannel(e.target.value)}
        placeholder="#codi-alerts"
        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition-all"
      />
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
    <label className="flex items-center space-x-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={notifyOnSuccess}
        onChange={(e) => setNotifyOnSuccess(e.target.checked)}
        className="rounded border-[#e2e8f0] text-[#0066ff] focus:ring-[#0066ff]"
      />
      <span className="text-xs font-medium text-slate-600">빌드 성공 시 즉시 채널 통지 전송</span>
    </label>
    <label className="flex items-center space-x-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={notifyOnFailure}
        onChange={(e) => setNotifyOnFailure(e.target.checked)}
        className="rounded border-[#e2e8f0] text-[#0066ff] focus:ring-[#0066ff]"
      />
      <span className="text-xs font-medium text-slate-600">품질 지표 심사 미달 시 슬랙 긴급 경보 자동 트리거</span>
    </label>
  </div>
</div>

{/* SET-003 Claude API 설정 */}
<div className="border-t border-slate-100 pt-6 space-y-4">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">SET-003</span>
        <h3 className="text-base font-bold text-slate-900">Claude API 설정</h3>
      </div>
      <p className="text-xs text-slate-400">코드 오딧 및 품질 심사를 위한 Anthropic Claude 엔진 파라미터 적용</p>
    </div>
    <button
      onClick={() => setIsClaudeActive(!isClaudeActive)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        isClaudeActive
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
      }`}
    >
      {isClaudeActive ? '✓ 엔진 테스트 완료' : '인퓨징 검증 이행'}
    </button>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Claude API Secret Key</label>
      <div className="relative">
        <input
          type={showClaudeKey ? 'text' : 'password'}
          value={claudeApiKey}
          onChange={(e) => setClaudeApiKey(e.target.value)}
          placeholder="sk-ant-sid01-..."
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066ff] rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-800 font-mono focus:outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setShowClaudeKey(!showClaudeKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showClaudeKey ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">추론 대상 모델 (Inference Model)</label>
      <select
        value={claudeModel}
        onChange={(e) => setClaudeModel(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-medium focus:outline-none text-slate-700 focus:bg-white focus:border-[#0066ff]"
      >
        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (v2)</option>
        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
        <option value="claude-3-opus-20240229">Claude 3 Opus (Intelligent)</option>
      </select>
    </div>
  </div>
</div>

        {/* 저장 버튼 */}
        <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400">
            <Sliders size={14} />
            <span className="text-xs font-medium">최신 설정 반영 준비됨</span>
          </div>
          <div className="flex items-center space-x-2">
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={12} /> 성공적으로 저장되었습니다
              </span>
            )}
            <button
              onClick={saveSettings}
              className="px-5 py-2.5 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              구성 파일 저장
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
