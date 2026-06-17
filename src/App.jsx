import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { INITIAL_PIPELINES } from './mockData'
import Dashboard from './pages/Dashboard'
import PipelineDetail from './pages/PipelineDetail'
import PipelineList from './pages/PipelineList'
import Settings from './pages/settings/Settings' 
import AccountSettings from './pages/settings/AccountSettings'
import RepositorySettings from './pages/settings/RepositorySettings'
import Login from './pages/Login'
import Register from './pages/Register'
import SessionManager from './pages/SessionManager'
import MCPHub from './pages/MCPHub'
import WorkflowDashboard from './pages/WorkflowDashboard'
import { logout } from './api/auth'
import { clearAuthSession, getAuthToken, getCurrentUser } from './api/authStorage'
import { getPipelineDetail, getPipelines } from './api/pipelines'
import { getApiErrorMessage, isApiEnabled } from './api/client'

const ACTIVE_TAB_STORAGE_KEY = 'codeaiActiveTabV1'
const LEGACY_TAB_ALIAS = {
  'workflow-dashboard': 'pipeline-stats',
  'event-log': 'connector-hub',
  'settings-system': 'settings-profile',
  'settings-account': 'settings-profile',
}

const ALLOWED_TABS = new Set([
  'dashboard',
  'connector-hub',
  'mcp-hub',
  'pipeline-list',
  'pipeline-detail',
  'pipeline-stats',
  'settings-profile',
  'settings-repositories',
])

const normalizeTabKey = (tab) => LEGACY_TAB_ALIAS[tab] || tab

const getInitialActiveTab = () => {
  try {
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
    const normalized = normalizeTabKey(saved)
    if (normalized && ALLOWED_TABS.has(normalized)) return normalized
  } catch {
    // Ignore storage read failures and fall back to dashboard.
  }
  return 'dashboard'
}

const toUiStatus = (status) => {
  const value = String(status || '').toUpperCase()
  if (value === 'SUCCESS') return 'SUCCESS'
  if (value === 'FAILED') return 'FAILED'
  if (value === 'RUNNING' || value === 'PENDING') return 'RUNNING'
  return status || 'RUNNING'
}

const toPipelineCard = (item) => {
  if (!item || !item.id) return null

  return {
    id: String(item.id),
    repositoryFullName: item.repositoryFullName,
    repo: item.repositoryFullName || '-',
    branch: item.headBranch || item.branch || '-',
    triggered: item.startedAt ? new Date(item.startedAt).toLocaleString('ko-KR') : '-',
    status: toUiStatus(item.status),
    timing: typeof item.durationSeconds === 'number' ? `${item.durationSeconds}초ㄹ` : '-',
    commit: item.prNumber ? String(item.prNumber) : '-',
    commentCount: 0,
    codeSnippet: '',
    aiComments: [],
    testResults: { passed: 0, failed: 0, total: 0, coverage: 0, suites: [] },
    notifications: [],
    vcsId: item.vcsId,
  }
}

export default function App() {
  const apiEnabled = isApiEnabled()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [activeTab, setActiveTab] = useState(getInitialActiveTab)
  const [isPipelineOpen, setIsPipelineOpen] = useState(() => getInitialActiveTab().startsWith('pipeline'))
  const [pipelines, setPipelines] = useState(INITIAL_PIPELINES)
  const [isPipelinesLoading, setIsPipelinesLoading] = useState(false)
  const [pipelineDataSource, setPipelineDataSource] = useState('checking')
  const [selectedPipelineId, setSelectedPipelineId] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => getInitialActiveTab().startsWith('settings'))
  const [currentUser, setCurrentUser] = useState({ username: '사용자', email: 'user@example.com' })

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser({
        username: user.username || '사용자',
        email: user.email || (user.username === '홍길동' ? 'hong@example.com' : `${user.username}@example.com`),
      });
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab)
    } catch {
      // Ignore storage write failures.
    }
  }, [activeTab])

  useEffect(() => {
    if (!isLoggedIn) return

    if (!apiEnabled) {
      setPipelineDataSource('mock')
      setPipelines(INITIAL_PIPELINES)
      setSelectedPipelineId((prev) => prev || INITIAL_PIPELINES[0]?.id || null)
      return
    }

    let mounted = true

    const loadPipelines = async () => {
      try {
        setIsPipelinesLoading(true)
        const result = await getPipelines({ page: 0, size: 50 })
        const content = Array.isArray(result?.data?.content) ? result.data.content : []
        const mapped = content.map(toPipelineCard).filter(Boolean)

        if (!mounted) return

        if (mapped.length === 0) {
          setPipelineDataSource('mock')
          setPipelines(INITIAL_PIPELINES)
          setSelectedPipelineId((prev) => prev || INITIAL_PIPELINES[0]?.id || null)
          return
        }

        setPipelines(mapped)
        setSelectedPipelineId((prev) => prev || mapped[0]?.id || null)
        setPipelineDataSource('api')
      } catch {
        if (mounted) {
          setPipelines(INITIAL_PIPELINES)
          setSelectedPipelineId((prev) => prev || INITIAL_PIPELINES[0]?.id || null)
          setPipelineDataSource('mock')
        }
      } finally {
        if (mounted) setIsPipelinesLoading(false)
      }
    }

    loadPipelines()
    return () => {
      mounted = false
    }
  }, [isLoggedIn, apiEnabled])

  const handleSelectPipeline = async (id) => {
    setSelectedPipelineId(id)
    setActiveTab('pipeline-detail')

    const hasLegacyData = pipelines.some((item) => String(item.id) === String(id) && (item.review || item.aiComments?.length > 0))
    if (hasLegacyData) return
    if (!apiEnabled) return

    try {
      const result = await getPipelineDetail(id)
      const detail = result?.data
      if (!detail) return

      setPipelines((prev) => {
        const idx = prev.findIndex((item) => String(item.id) === String(id))
        if (idx < 0) return prev
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          ...detail,
          id: String(detail.id || id),
          repo: detail.repositoryFullName || next[idx].repo,
          repositoryFullName: detail.repositoryFullName || next[idx].repositoryFullName,
          branch: detail.headBranch || next[idx].branch,
          timing: typeof detail.durationSeconds === 'number' ? `${detail.durationSeconds}초` : next[idx].timing,
          commit: detail.prNumber ? String(detail.prNumber) : next[idx].commit,
          status: toUiStatus(detail.status),
          triggered: detail.startedAt ? new Date(detail.startedAt).toLocaleString('ko-KR') : next[idx].triggered,
        }
        return next
      })
    } catch (error) {
      console.warn(getApiErrorMessage(error, '파이프라인 상세 정보를 불러오지 못했습니다.'))
    }
  }

  const currentPipeline = pipelines.find(p => String(p.id) === String(selectedPipelineId)) || pipelines[0]

  const handleSystemLogout = async () => {
    const confirmLogout = window.confirm("로그아웃을 하시겠습니까?");
    if (!confirmLogout) return;

    const token = getAuthToken();

    try {
      if (token) {
        await logout(token);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 401) {
        const message =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "로그아웃 요청 중 오류가 발생했습니다.";
        alert(message);
      }
    } finally {
      clearAuthSession();
      setIsLoggedIn(false);
      setActiveTab('dashboard');
      alert("로그아웃 되었습니다. 다시 로그인 해주세요.");
    }
  };

  const userInitial = currentUser.username ? currentUser.username.charAt(0) : "U";

  if (!isLoggedIn) {
    if (isRegisterMode) {
      return <Register onNavigateToLogin={() => setIsRegisterMode(false)} />;
    }
    return (
      <Login 
        onLoginSuccess={() => setIsLoggedIn(true)} 
        onNavigateToRegister={() => setIsRegisterMode(true)} 
      />
    );
  }

  return (
    <SessionManager onTimeout={handleSystemLogout}>
      {({ timeLeft, formatTime }) => (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex w-screen">
          
          <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
            <div className="flex flex-col flex-1">
              <div
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-6 border-b border-[#f1f5f9] flex items-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#0066ff] flex items-center justify-center text-white font-bold text-lg shrink-0">C</div>
                <span className="ml-3 font-bold text-lg tracking-tight text-[#0f172a]">Code AI</span>
              </div>

              <nav className="px-4 py-6 space-y-1.5 flex-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center ${activeTab === 'dashboard' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  대시보드
                </button>

                <button
                  onClick={() => setActiveTab('connector-hub')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left ${activeTab === 'connector-hub' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  커넥터
                </button>

                <button
                  onClick={() => setActiveTab('mcp-hub')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left ${activeTab === 'mcp-hub' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  MCP
                </button>

                <div>
                  <button
                    onClick={() => setIsPipelineOpen(!isPipelineOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('pipeline') ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>파이프라인</span>
                    {isPipelineOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isPipelineOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button onClick={() => setActiveTab('pipeline-list')} className="w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-[#0066ff] text-left">전체 실행 목록</button>
                      <button onClick={() => setActiveTab('pipeline-detail')} className="w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-[#0066ff] text-left">실행 상세 내역</button>
                      <button onClick={() => setActiveTab('pipeline-stats')} className="w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-[#0066ff] text-left">파이프라인 통계</button>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('settings') ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>설정</span>
                    {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isSettingsOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => setActiveTab('settings-profile')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'settings-profile' ? 'text-[#0066ff]' : 'text-slate-500 hover:text-[#0066ff]'}`}
                      >
                        프로필
                      </button>
                      <button
                        onClick={() => setActiveTab('settings-repositories')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'settings-repositories' ? 'text-[#0066ff]' : 'text-slate-500 hover:text-[#0066ff]'}`}
                      >
                        레포지토리 관리
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <div className="p-4 border-t border-[#f1f5f9] space-y-3">
              <div className="session-timer-dock flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300 font-medium">세션 만료까지</span>
                </div>
                <span className="font-mono text-emerald-400 text-sm tracking-wider">{formatTime(timeLeft)}</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-xl transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#0066ff] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {userInitial}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-sm font-bold text-[#0f172a] truncate">{currentUser.username}</span>
                    <span className="text-xs font-medium text-slate-400 truncate max-w-[125px]">{currentUser.email}</span>
                  </div>
                </div>
                <button 
                    onClick={handleSystemLogout}
                  className="text-3xl text-slate-600 hover:text-rose-500 font-bold px-2 py-1 transition-colors"
                    title="로그아웃"
                >
                  ↗️
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto px-10 py-10 min-h-screen">
            <div className="mb-4 flex items-center justify-end">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                  pipelineDataSource === 'api'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : pipelineDataSource === 'mock'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {pipelineDataSource === 'api'
                  ? '데이터 소스: API 연결됨'
                  : pipelineDataSource === 'mock'
                      ? '데이터 소스: Mock 사용중'
                      : '데이터 소스: 확인중'}
              </span>
            </div>

            {activeTab === 'dashboard' && <Dashboard pipelines={pipelines} onSelectPipeline={handleSelectPipeline} />}

            {activeTab === 'connector-hub' && <MCPHub isActive mode="connectors" />}

            {activeTab === 'mcp-hub' && <MCPHub isActive mode="mcp" />}

            {activeTab === 'pipeline-stats' && <WorkflowDashboard isActive />}

            {activeTab === 'pipeline-list' && <PipelineList pipelines={pipelines} onSelectPipeline={handleSelectPipeline} />}
            {activeTab === 'pipeline-detail' && (
              currentPipeline ? (
                <PipelineDetail
                  pipeline={currentPipeline}
                  allPipelines={pipelines}
                  onSelectPipeline={handleSelectPipeline}
                  onBack={() => setActiveTab('pipeline-list')}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">표시할 파이프라인 데이터가 없습니다.</div>
              )
            )}
            {activeTab === 'settings-profile' && <AccountSettings onLogout={() => setIsLoggedIn(false)} />}
            {activeTab === 'settings-repositories' && <RepositorySettings />}
            {activeTab === 'settings-system' && <Settings />}
          </main>
        </div>
      )}
    </SessionManager>
  )
}
