import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import PipelineDetail from './pages/PipelineDetail'
import PipelineList from './pages/PipelineList'
import Settings from './pages/settings/Settings'
import CodeAnalysis from './pages/CodeAnalysis'
import Login from './pages/Login'
import Register from './pages/Register'
import SessionManager from './pages/SessionManager'
import { logout } from "./api/auth";
import AccountSettings from "./pages/settings/AccountSettings";
import CodiLogo from './LOGO1.png';


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isPipelineOpen, setIsPipelineOpen] = useState(false)
  const [selectedPipelineId, setSelectedPipelineId] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState({ username: '사용자', email: 'user@example.com' })
  const [stats, setStats] = useState(null)

  const [pipelines, setPipelines] = useState([]);

  // ✅ 1. 로그인 상태 복원 (최초 마운트 시 1회 실행)
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser({
          username: parsedUser.username || '사용자',
          email: parsedUser.email || `${parsedUser.username || 'user'}@example.com`
        });
      } catch (e) {
        setCurrentUser({ username: user, email: `${user}@example.com` });
      }
    }
  }, []);

  // ✅ 2. 로그인 상태일 때만 브라우저 스토리지의 토큰을 읽어 API 요청 (문법 오류 수정 완료)
  useEffect(() => {
    if (!isLoggedIn) return;

    // 로컬 스토리지에서 토큰 동적 추출 (하드코딩 방지)
    const savedToken = localStorage.getItem("authToken");
    if (!savedToken) return;

    const authHeader = `Bearer ${savedToken}`;

    // 1) 통계 데이터 가져오기
fetch('/api/pipelines/stats', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': authHeader
  }
})
.then(res => {
  if (!res.ok) throw new Error('Stats 응답 에러');
  return res.json();
})
.then(data => {
  console.log('stats 응답:', data);  // ← 이 줄 추가
  if (data.success) setStats(data.data);
})
.catch(err => console.error('stats fetch 실패:', err));

    // 2) 파이프라인 목록 가져오기
    fetch('/api/pipelines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Pipelines 응답 에러');
      return res.json();
    })
    .then(json => { 
      if (json.success) setPipelines(json.data.content || json.data);
    })
    .catch(err => console.error('pipelines fetch 실패:', err));
  }, [isLoggedIn]);

  const handleSelectPipeline = (id) => {
    setSelectedPipelineId(id)
    setActiveTab('pipeline-detail')
  }

  const currentPipeline = pipelines.find(p => String(p.id) === String(selectedPipelineId))

  const handleSystemLogout = useCallback(async () => {
    const confirmLogout = window.confirm("로그아웃을 하시겠습니까?");
    if (!confirmLogout) return;

    const savedToken = localStorage.getItem("authToken");

    try {
      if (savedToken) {
        await logout(savedToken);
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
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("tokenExpiresIn");
      setIsLoggedIn(false);
      setActiveTab('dashboard');
      alert("로그아웃 되었습니다. 다시 로그인 해주세요.");
    }
  }, []);

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
          {/* 사이드바 */}
          <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
            <div className="flex flex-col flex-1">

{/* 로고 영역 */}
<div 
  className="px-6 py-5 border-b border-[#f1f5f9] flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
  onClick={() => setActiveTab('dashboard')}
>
  <img src={CodiLogo} alt="Codi 로고" className="w-36 h-auto object-contain" />
</div>

              <nav className="px-4 py-6 space-y-1.5 flex-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'dashboard' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'dashboard' ? 'bg-[#0066ff]' : 'bg-slate-300'}`} />
                  대시보드
                </button>

                <div>
                  <button
                    onClick={() => setIsPipelineOpen(!isPipelineOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('pipeline') ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab.startsWith('pipeline') ? 'bg-[#0066ff]' : 'bg-slate-300'}`} />
                      <span>파이프라인</span>
                    </div>
                    {isPipelineOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isPipelineOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => setActiveTab('pipeline-list')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'pipeline-list' ? 'text-[#0066ff]' : 'text-slate-500 hover:text-[#0066ff]'}`}
                      >
                        전체 실행 목록
                      </button>
                      <button
                        onClick={() => setActiveTab('pipeline-detail')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'pipeline-detail' ? 'text-[#0066ff]' : 'text-slate-500 hover:text-[#0066ff]'}`}
                      >
                        실행 상세 내역
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('code-analysis')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'code-analysis' ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'code-analysis' ? 'bg-[#0066ff]' : 'bg-slate-300'}`} />
                  실시간 코드 분석
                </button>

                <div>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('settings') ? 'bg-[#e6f0ff] text-[#0066ff]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab.startsWith('settings') ? 'bg-[#0066ff]' : 'bg-slate-300'}`} />
                      <span>설정</span>
                    </div>
                    {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isSettingsOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => setActiveTab('settings-system')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'settings-system' ? 'text-[#0066ff]' : 'text-slate-500 hover:text-[#0066ff]'}`}
                      >
                        시스템 설정
                      </button>
                      <button
                        onClick={() => setActiveTab('settings-account')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'settings-account' ? 'text-[#0066ff]' : 'text-slate-500 hover:text-[#0066ff]'}`}
                      >
                        계정 설정
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <div className="p-4 border-t border-[#f1f5f9] space-y-3 bg-slate-50/40">
              <div className="session-timer-dock flex items-center justify-between rounded-xl px-2 py-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 font-semibold tracking-tight">세션 유지 중</span>
                </div>
                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md text-xs font-bold tracking-wider">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-xl transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#0066ff] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {userInitial}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-sm font-bold text-[#0f172a] truncate">{currentUser?.username}</span>
                    <span className="text-xs font-medium text-slate-400 truncate max-w-[125px]">{currentUser?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleSystemLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white border border-transparent hover:border-slate-100 rounded-lg shadow-none hover:shadow-sm transition-all flex items-center justify-center cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </aside>

          {/* 메인 컨텐츠 */}
          <main className="flex-1 overflow-y-auto px-10 py-10 min-h-screen">
            {activeTab === 'dashboard' && <Dashboard pipelines={pipelines} stats={stats} onSelectPipeline={handleSelectPipeline} />}
            {activeTab === 'pipeline-list' && <PipelineList pipelines={pipelines} onSelectPipeline={handleSelectPipeline} />}
            {activeTab === 'pipeline-detail' && (
              currentPipeline
                ? <PipelineDetail
                    pipeline={currentPipeline}
                    allPipelines={pipelines}
                    onSelectPipeline={(id) => setSelectedPipelineId(id)}
                    onBack={() => setActiveTab('pipeline-list')}
                  />
                : <div className="flex items-center justify-center h-96 text-sm text-slate-400">파이프라인을 선택해주세요.</div>
            )}
            {activeTab === 'code-analysis' && <CodeAnalysis />}
            {activeTab === 'settings-system' && <Settings />}
            {activeTab === 'settings-account' && (
              <AccountSettings onLogout={() => setIsLoggedIn(false)} />
            )}
          </main>
        </div>
      )}
    </SessionManager>
  )
}