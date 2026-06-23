import { useState, useEffect } from 'react'
import { logout } from "../../api/auth";
import { Lock, AlertTriangle } from 'lucide-react'; 

const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('ko-KR')
}

export default function AccountSettings({ onLogout }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [logoutMsg, setLogoutMsg] = useState('')

    // 사용자 이름 상태 관리용 추가
    const [userName, setUserName] = useState('')
    const [profileMsg, setProfileMsg] = useState({ text: '', isError: false })

    // 비밀번호 상태 관리용
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
    const [pwdMsg, setPwdMsg] = useState({ text: '', isError: false })

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('currentUser'))
            if (stored) {
                setCurrentUser(stored)
                setUserName(stored.name || '') // 로컬스토리지에 name이 있다면 초기화
            }
        } catch {
            setCurrentUser(null)
        }
    }, [])

    // 프로필(이름) 변경 핸들러
    const handleUpdateProfile = (e) => {
        e.preventDefault();
        if (!userName.trim()) {
            setProfileMsg({ text: '이름을 입력해주세요.', isError: true });
            return;
        }

        // TODO: 백엔드 API 연동 시 fetch나 axios로 교체
        console.log('이름 변경 요청 데이터:', userName);
        
        // 로컬스토리지 및 상태 업데이트 (가짜 업데이트 로직)
        const updatedUser = { ...currentUser, name: userName };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        setProfileMsg({ text: '이름이 성공적으로 변경되었습니다.', isError: false });
        
        // 3초 후 성공 메시지 초기화
        setTimeout(() => setProfileMsg({ text: '', isError: false }), 3000);
    };

    // 로그아웃 핸들러
    const handleLogout = async () => {
        setLogoutLoading(true)
        setLogoutMsg('')
        const token = localStorage.getItem('authToken')

        try {
            const result = await logout(token)
            if (!result?.success) {
                setLogoutMsg(result?.message || '로그아웃 실패')
            }
        } catch (error) {
            const message = error?.response?.data?.error?.message
            if (message) setLogoutMsg(message)
            console.error('logout 실패:', error)
        } finally {
            localStorage.removeItem('authToken')
            localStorage.removeItem('tokenType')
            localStorage.removeItem('tokenExpiresIn')
            localStorage.removeItem('currentUser')
            setLogoutLoading(false)
            onLogout?.()
        }
    }

    // 비밀번호 변경 핸들러
    const handleChangePassword = (e) => {
        e.preventDefault();
        if (!passwords.current || !passwords.next || !passwords.confirm) {
            setPwdMsg({ text: '모든 필드를 입력해주세요.', isError: true });
            return;
        }
        if (passwords.next !== passwords.confirm) {
            setPwdMsg({ text: '새 비밀번호가 일치하지 않습니다.', isError: true });
            return;
        }
        
        // TODO: 백엔드 API 연동 시 이 부분을 fetch나 axios로 교체
        console.log('비밀번호 변경 요청 데이터:', passwords);
        setPwdMsg({ text: '비밀번호가 성공적으로 변경되었습니다.', isError: false });
        setPasswords({ current: '', next: '', confirm: '' });
    };

    // 회원 탈퇴 핸들러
    const handleWithdraw = () => {
        const confirmFirst = window.confirm("정말로 탈퇴하시겠습니까? 탈퇴 시 모든 분석 데이터 및 파이프라인 정보가 영구 삭제되며 복구할 수 없습니다.");
        if (!confirmFirst) return;

        const confirmSecond = window.prompt("탈퇴를 확정하려면 '계정탈퇴'라고 정확히 입력해 주세요.");
        if (confirmSecond !== "계정탈퇴") {
            alert("입력 내용이 유효하지 않아 탈퇴가 취소되었습니다.");
            return;
        }

        // TODO: 백엔드 탈퇴 API 연동 시 이곳에서 처리
        alert("회원 탈퇴 처리가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
        
        localStorage.clear();
        onLogout?.();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="grid grid-cols-2 items-end mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✦</span>
                        <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">계정 설정</h1>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="px-3 py-1 bg-[#e6f0ff] border border-[#bfdbfe] rounded-lg text-xs font-bold text-[#0066ff] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
                        Ready to Analyze
                    </div>
                </div>
            </div>

            <hr className="border-slate-200" />

            {/* 카드 1: 기본 계정 정보 및 프로필 수정 */}
            <form onSubmit={handleUpdateProfile} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">ACC-001</span>
                        <h3 className="text-base font-bold text-slate-900">계정 정보</h3>
                    </div>
                    <p className="text-xs text-slate-400">기본 프로필 정보 및 세션 관리</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 사용자 이름 (수정 가능) */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">사용자 이름</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="이름을 입력하세요"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all"
                        />
                    </div>

                    {/* 이메일 (읽기 전용) */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">이메일</label>
                        <input
                            type="text"
                            value={currentUser?.email || '-'}
                            readOnly
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default"
                        />
                    </div>

                    {/* 로그인 시각 (읽기 전용) */}
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">최근 로그인 시각</label>
                        <input
                            type="text"
                            value={formatDate(currentUser?.loginTime)}
                            readOnly
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs font-semibold ${profileMsg.isError ? 'text-red-500' : 'text-emerald-500'}`}>
                        {profileMsg.text}
                    </span>
                    
                    <div className="flex items-center gap-3">
                        {logoutMsg && (
                            <span className="text-xs font-semibold text-red-500">{logoutMsg}</span>
                        )}
                        <button
                            type="button" /* form 제출 방지용 */
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                            {logoutLoading ? '로그아웃 중...' : '로그아웃'}
                        </button>
                        
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                        >
                            이름 저장
                        </button>
                    </div>
                </div>
            </form>

            {/* 카드 2: 비밀번호 변경 */}
            <form onSubmit={handleChangePassword} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <Lock size={16} className="text-slate-400" />
                        <h3 className="text-base font-bold text-slate-900">비밀번호 변경</h3>
                    </div>
                    <p className="text-xs text-slate-400">보안 유지를 위해 비밀번호를 주기적으로 변경해 주세요.</p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">현재 비밀번호</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">새 비밀번호</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={passwords.next}
                                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">새 비밀번호 확인</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs font-semibold ${pwdMsg.isError ? 'text-red-500' : 'text-emerald-500'}`}>
                        {pwdMsg.text}
                    </span>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                    >
                        비밀번호 업데이트
                    </button>
                </div>
            </form>

            {/* 카드 3: Danger Zone */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle size={16} className="text-rose-500" />
                        <h3 className="text-base font-bold text-rose-900">위험 구역 (Danger Zone)</h3>
                    </div>
                    <p className="text-xs text-rose-600/80">계정 삭제 시 복구 불가능한 영구적인 조치가 취해집니다.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-rose-100 rounded-xl">
                    <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900">Code AI 서비스 탈퇴</h4>
                        <p className="text-[11px] text-slate-400">워크스페이스 내의 모든 파이프라인 연동 데이터 및 계정 정보가 소멸됩니다.</p>
                    </div>
                    <button
                        onClick={handleWithdraw}
                        className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm whitespace-nowrap"
                    >
                        계정 폐쇄 및 탈퇴
                    </button>
                </div>
            </div>
        </div>
    )
}