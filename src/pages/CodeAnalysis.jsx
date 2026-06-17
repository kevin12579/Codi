import { useState } from 'react'
import { Copy, ChevronRight, Loader2 } from 'lucide-react'

import { SAMPLE_FILES, LANGUAGES, SAMPLE_CODE, MOCK_RESULT, MOCK_RESULT_PAYMENT, MOCK_RESULT_GO } from '../mockData'

// ─── 배지 색상 ────────────────────────────────────────────────
const TYPE_STYLE = {
  critical: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-400' },
  info: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-400' },
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────────
function IssueCard({ issue }) {
  const s = TYPE_STYLE[issue.type]
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.fix)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
              {issue.typeLabel}
            </span>
            <span className="text-xs text-slate-400">Line {issue.line} 지점</span>
          </div>
          <p className="text-sm font-semibold text-[#0f172a]">{issue.title}</p>
        </div>
        <button
          onClick={handleCopy}
          title="수정 예시 복사"
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Copy size={14} />
        </button>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{issue.description}</p>
      <div className="bg-[#0f172a] rounded-xl p-4 overflow-x-auto">
        <p className="text-[10px] text-slate-500 mb-2 font-mono">수정 가이드 코드</p>
        <pre className="text-xs text-[#7dd3fc] font-mono whitespace-pre-wrap leading-relaxed">{issue.fix}</pre>
      </div>
      {copied && <p className="text-xs text-[#0066ff] font-medium">복사 완료!</p>}
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────────
export default function CodeAnalysis() {
  const [selectedFile, setSelectedFile] = useState(SAMPLE_FILES[0])
  const [filename, setFilename] = useState('UserService.ts')
  const [language, setLanguage] = useState('TypeScript')
  const [code, setCode] = useState(SAMPLE_CODE)
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [result, setResult] = useState(null)

  const lineCount = code.split('\n').length

  const handleRun = () => {
    setStatus('loading')
    setResult(null)
    setTimeout(() => {
      setStatus('done')
      if (selectedFile.id === 2) {
        setResult(MOCK_RESULT_PAYMENT)
      } else if (selectedFile.id === 3) {
        setResult(MOCK_RESULT_GO)
      } else {
        setResult(MOCK_RESULT)
      }
    }, 2200)
  }

  return (
<div className="space-y-6">
  {/* [해결] grid를 사용하여 제목과 상태를 좌우로 완벽하게 분리 */}
  <div className="grid grid-cols-2 items-end mb-2">
    {/* 왼쪽: 제목 영역 */}
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">✦</span>
        <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">실시간 AI 코드 분석기</h1>
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

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* 왼쪽: 입력 패널 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-5">
          {/* 샘플 파일 목록 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">진단 대상 샘플릿 코드</p>
            <div className="space-y-2">
              {SAMPLE_FILES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFile(f); setFilename(f.name); setCode(f.code) }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                    selectedFile.id === f.id
                      ? 'bg-[#0066ff] text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{f.name} ({f.label})</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* 파일명 + 언어 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">파일명</label>
              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">언어</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 bg-white"
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* 코드 에디터 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">소스코드 붙여넣기</label>
              <span className="text-xs text-slate-400">{lineCount} lines</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 px-4 py-4 bg-[#0f172a] text-[#7dd3fc] text-xs font-mono rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0066ff]/40 leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={handleRun}
            disabled={status === 'loading' || !code.trim()}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              status === 'loading' || !code.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#0066ff] text-white hover:bg-[#0052cc] active:scale-[0.98]'
            }`}
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Codi 심층 오딧 가동 중...
              </>
            ) : (
              <>✦ 실시간 코드 검수 실행</>
            )}
          </button>
          {status === 'done' && (
            <p className="text-center text-xs text-slate-400">✓ SLA 즉각 기준 활성 · <span className="text-[#0066ff] font-medium">강화 오딧 기준 (80점)</span></p>
          )}
        </div>

        {/* 오른쪽: 결과 패널 */}
        <div className="space-y-4">
          {/* idle */}
          {status === 'idle' && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl flex flex-col items-center justify-center py-24 text-center px-8 space-y-3">
              <span className="text-3xl text-slate-200">{'>/_ '}</span>
              <p className="text-sm font-semibold text-slate-500">검사 대기 중. . . </p>
              <p className="text-xs text-slate-400">왼쪽 샌드박스에 코드를 작성하고 버튼을 눌러 Codi에게 검수를 청구하세요.</p>
            </div>
          )}

          {/* loading */}
          {status === 'loading' && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl flex flex-col items-center justify-center py-24 text-center px-8 space-y-3">
              <Loader2 size={28} className="animate-spin text-[#0066ff]" />
              <p className="text-sm font-semibold text-slate-600">샌드박스 오딧 진단 진행</p>
              <p className="text-xs text-slate-400 leading-relaxed">제출 코드를 기반으로 구문 분석, 시큐어 코딩 규칙 충돌 및 변수 생명<br />주기를 파악하고 있습니다. 잠시만 대기하십시오.</p>
            </div>
          )}

          {/* done - 결과 */}
          {status === 'done' && result && (
            <>
              {/* 점수 요약 */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">품질 진단 종합 리포트</p>
                    <p className="text-base font-bold text-[#0f172a]">{result.filename}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">코드 텍스트 지표</p>
                    <p className="text-3xl font-black" style={{ color: result.scoreColor }}>{result.score}점</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{result.summary}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '치명적 위험', value: result.critical, type: 'critical' },
                    { label: '경고 요소', value: result.warning, type: 'warning' },
                    { label: '개선 의견', value: result.info, type: 'info' },
                  ].map((item) => {
                    const s = TYPE_STYLE[item.type]
                    return (
                      <div key={item.label} className={`rounded-xl p-3 border ${s.bg} ${s.border}`}>
                        <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-black text-[#0f172a]">{item.value}건</span>
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 이슈 목록 */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <span className="text-[#0066ff]">✦</span> 상세 지침 검수 목록
                </p>
                {result.issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
              </div>

              {/* 파이프라인 등재 배너 */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">파이프라인 지위 자동 등재 완료</p>
                  <p className="text-xs text-slate-400 mt-0.5">본 분석 결과가 새로운 파이프라인 항목으로 목록에 반영되었습니다.</p>
                </div>
                <button className="shrink-0 px-4 py-2 bg-[#0066ff] text-white text-xs font-semibold rounded-xl hover:bg-[#0052cc] transition-colors">
                  상세 워크벤치 이동
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
