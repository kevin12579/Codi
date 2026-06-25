import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, LogOut, ShieldAlert } from 'lucide-react'

import Dashboard from './pages/Dashboard'
import PipelineDetail from './pages/PipelineDetail'
import PipelineList from './pages/PipelineList'
import Login from './pages/Login'
import Register from './pages/Register'
import SessionManager from './pages/SessionManager'
import { logout } from "./api/auth";
import AccountSettings from "./pages/settings/AccountSettings";

import MCPHub from './pages/MCPHub'
import MCPTools from './pages/mcp/MCPTools'
import MCPGuide from './pages/mcp/MCPGuide'
import RepositorySettings from './pages/settings/RepositorySettings'
import PipelineStats from './pages/PipelineStats'
import CodiLogo from './LOGO1.png';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserLogs from './pages/admin/AdminUserLogs'; 
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isPipelineOpen, setIsPipelineOpen] = useState(false)
  const [selectedPipelineId, setSelectedPipelineId] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const intervalRef = useRef(null)
  const [isMcpOpen, setIsMcpOpen] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [currentUser, setCurrentUser] = useState({ 
    username: '사용자', 
    email: 'user@example.com',
    role: 'USER' 
  })
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  const [darkMode, setDarkMode] = useState(false)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleLoginSuccess = (userData) => {
    const user = { ...userData, role: userData?.role || 'USER' };
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setIsLoggedIn(true);
  };

  const [pipelines, setPipelines] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser({
          username: parsedUser.username || '사용자',
          email: parsedUser.email || 'user@example.com',
          role: parsedUser.role || 'USER' 
        });
      } catch (e) {
        setCurrentUser({ 
          username: user, 
          email: `${user}@example.com`,
          role: 'USER' 
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const savedToken = localStorage.getItem("authToken");
    if (!savedToken) return;

    const authHeader = `Bearer ${savedToken}`;

    // 🔥 환경변수 주소 조립 및 정제
    const apiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
    const cleanUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    
    // 환경변수 주소가 없으면 기존처럼 로컬 프록시용 '/api'로 사용합니다.
    const finalBaseUrl = apiUrl ? cleanUrl : '/api';

    const fetchAll = () => {
      // 1. Stats 요청 주소 변경
      fetch(`${finalBaseUrl}/pipelines/stats`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader,
          'ngrok-skip-browser-warning': 'true' // 🔥 ngrok 경고 우회 헤더 추가
        }
      })
      .then(res => { if (!res.ok) throw new Error('Stats 응답 에러'); return res.json(); })
      .then(data => { if (data.success) setStats(data.data); })
      .catch(err => console.error('stats fetch 실패:', err));

      // 2. Pipelines 요청 주소 변경
      fetch(`${finalBaseUrl}/pipelines`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader,
          'ngrok-skip-browser-warning': 'true' // 🔥 ngrok 경고 우회 헤더 추가
        }
      })
      .then(res => { if (!res.ok) throw new Error('Pipelines 응답 에러'); return res.json(); })
      .then(json => {
        if (json.success) {
          const list = json.data.content || json.data;
          setPipelines(list);
          const hasRunning = list.some(p => p.status?.toUpperCase() === 'RUNNING');
          if (!hasRunning && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      })
      .catch(err => console.error('pipelines fetch 실패:', err));
    };

    fetchAll();
    intervalRef.current = setInterval(fetchAll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
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
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setIsRegisterMode(true)}
      />
    );
  }

  return (
    <AuthProvider user={currentUser} isLoggedIn={isLoggedIn}>
      <SessionManager onTimeout={handleSystemLogout}>
        {({ timeLeft, formatTime }) => (
          
          <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-900 dark:text-white font-sans antialiased flex w-screen">
            {/* 사이드바 */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-[#e2e8f0] dark:border-slate-700 flex flex-col shrink-0 sticky top-0 h-screen z-20">

              {/* 로고 영역 */}
              <div
                className="px-6 py-5 border-b border-[#f1f5f9] dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                onClick={() => setActiveTab('dashboard')}
              >
                <img src={CodiLogo} alt="Codi 로고" className="w-36 h-auto object-contain" />
              </div>

              {/* nav */}
              <nav className="px-4 py-6 space-y-1.5 flex-1 overflow-y-auto min-h-0">

                {/* 대시보드 */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-[#e6f0ff] text-[#0066ff]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeTab === 'dashboard' ? 'bg-[#0066ff] animate-glow' : 'bg-slate-300'
                  }`} />
                  대시보드
                </button>

                {/* 커넥터 */}
                <button
                  onClick={() => setActiveTab('connector')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'connector'
                      ? 'bg-[#e6f0ff] text-[#0066ff]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeTab === 'connector' ? 'bg-[#0066ff] animate-glow' : 'bg-slate-300'
                  }`} />
                  커넥터
                </button>

                {/* 파이프라인 */}
                <div>
                  <button
                    onClick={() => setIsPipelineOpen(!isPipelineOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      (activeTab === 'pipeline-list' || activeTab === 'pipeline-detail' || activeTab === 'pipeline-stats')
                        ? 'bg-[#e6f0ff] text-[#0066ff]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (activeTab === 'pipeline-list' || activeTab === 'pipeline-detail')
                          ? 'bg-[#0066ff] animate-glow'
                          : 'bg-slate-300'
                      }`} />
                      <span>파이프라인</span>
                    </div>
                    {isPipelineOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isPipelineOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => setActiveTab('pipeline-list')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'pipeline-list' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}
                      >
                        전체 실행 목록
                      </button>
                      <button
                        onClick={() => { setSelectedPipelineId(null); setActiveTab('pipeline-detail') }}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'pipeline-detail' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}
                      >
                        실행 상세 내역
                      </button>
                      <button
                        onClick={() => setActiveTab('pipeline-stats')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'pipeline-stats' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}
                      >
                        통계
                      </button>
                    </div>
                  )}
                </div>

                {/* MCP */}
                <div>
                  <button
                    onClick={() => setIsMcpOpen(!isMcpOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('mcp')
                        ? 'bg-[#e6f0ff] text-[#0066ff]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeTab.startsWith('mcp') ? 'bg-[#0066ff] animate-glow' : 'bg-slate-300'
                      }`} />
                      <span>MCP</span>
                    </div>
                    {isMcpOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isMcpOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button onClick={() => setActiveTab('mcp-tools')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'mcp-tools' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}>
                        도구 목록
                      </button>
                      <button onClick={() => setActiveTab('mcp-guide')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'mcp-guide' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}>
                        연결 가이드
                      </button>
                    </div>
                  )}
                </div>

                {/* 설정 */}
                <div>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('settings')
                        ? 'bg-[#e6f0ff] text-[#0066ff]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeTab.startsWith('settings') ? 'bg-[#0066ff] animate-glow' : 'bg-slate-300'
                      }`} />
                      <span>설정</span>
                    </div>
                    {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isSettingsOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => setActiveTab('settings-account')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'settings-account' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}
                      >
                        프로필 설정
                      </button>
                      <button
                        onClick={() => setActiveTab('settings-repo')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'settings-repo' ? 'text-[#0066ff]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0066ff]'}`}
                      >
                        레포지토리 설정
                      </button>
                    </div>
                  )}
                </div>
              </nav>

              {/* 관리자 전용 메뉴 */}
              {currentUser?.role === 'ADMIN' && (
                <div className="px-4 pb-2 shrink-0">
                  <button
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      activeTab.startsWith('admin')
                        ? 'bg-rose-50 text-rose-600'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeTab.startsWith('admin') ? 'bg-rose-500 animate-glow' : 'bg-slate-300'
                      }`} />
                      <span>관리자 모드</span>
                    </div>
                    {isAdminOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isAdminOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => setActiveTab('admin-dashboard')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'admin-dashboard' ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'}`}
                      >
                        대시보드
                      </button>
                      <button
                        onClick={() => setActiveTab('admin-logs')}
                        className={`w-full px-4 py-2 text-xs font-medium text-left ${activeTab === 'admin-logs' ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'}`}
                      >
                        행위 이력 조회
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 계정 영역 */}
              <div className="p-4 border-t border-[#f1f5f9] dark:border-slate-700 space-y-3 bg-slate-50/40 dark:bg-slate-800/40 shrink-0">
                <div className="session-timer-dock flex items-center justify-between rounded-xl px-2 py-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold tracking-tight">세션 유지 중</span>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-xs font-bold tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0066ff] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {userInitial}
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm font-bold text-[#0f172a] dark:text-white truncate">{currentUser?.username}</span>
                      <span className="text-xs font-medium text-slate-400 truncate max-w-[125px]">{currentUser?.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSystemLogout}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-100 dark:hover:border-slate-600 rounded-lg shadow-none hover:shadow-sm transition-all flex items-center justify-center cursor-pointer"
                    title="로그아웃"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>

            </aside>

            {maintenanceMode && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-2xl text-center">
                  <ShieldAlert size={48} className="text-rose-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-900">시스템 점검 중</h2>
                  <p className="text-slate-500 mt-2">현재 관리자에 의해 점검 모드가 활성화되었습니다.</p>
                  <p className="text-slate-500 mt-2">잠시 후 이용 바랍니다.</p>
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      onClick={() => setMaintenanceMode(false)}
                      className="mt-6 px-5 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
                    >
                      점검 모드 해제
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 메인 컨텐츠 */}
            <main className="flex-1 overflow-y-auto px-10 py-10 min-h-screen">
              {activeTab === 'dashboard' && <Dashboard
                pipelines={pipelines}
                stats={stats}
                onSelectPipeline={handleSelectPipeline}
                darkMode={darkMode}
                onToggleDark={() => setDarkMode(!darkMode)}
              />}
              {activeTab === 'pipeline-list' && <PipelineList onSelectPipeline={handleSelectPipeline} />}
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
              {activeTab === 'pipeline-stats' && <PipelineStats />}

              {activeTab === 'connector' && <MCPHub isActive mode="connectors" />}

              {activeTab === 'mcp-tools' && <MCPTools />}
              {activeTab === 'mcp-guide' && <MCPGuide />}

              {activeTab === 'settings-account' && <AccountSettings onLogout={() => setIsLoggedIn(false)} />}
              {activeTab === 'settings-repo' && <RepositorySettings />}

              {currentUser.role === 'ADMIN' && (
                <>
                  {activeTab === 'admin-dashboard' && (
                    <AdminDashboard
                      maintenanceMode={maintenanceMode}
                      onToggleMaintenance={() => setMaintenanceMode(prev => !prev)}
                    />
                  )}
                  {activeTab === 'admin-logs' && <AdminUserLogs />}
                </>
              )}
            </main>
          </div>
        )}
      </SessionManager>
    </AuthProvider>
  )
}