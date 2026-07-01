import { useState, useEffect } from 'react'
import { logout } from "../../api/auth";
import { Lock, AlertTriangle } from 'lucide-react'; 
import { formatDate } from '../../lib/formatDate'


export default function AccountSettings({ onLogout }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [logoutMsg, setLogoutMsg] = useState('')
    const [userName, setUserName] = useState('')
    const [profileMsg, setProfileMsg] = useState({ text: '', isError: false })
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
    const [pwdMsg, setPwdMsg] = useState({ text: '', isError: false })
    const [pwdLoading, setPwdLoading] = useState(false)

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('currentUser'))
            if (stored) { setCurrentUser(stored); setUserName(stored.name || '') }
        } catch { setCurrentUser(null) }
    }, [])

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        if (!userName.trim()) { setProfileMsg({ text: '이름을 입력해주세요.', isError: true }); return; }
        const updatedUser = { ...currentUser, name: userName };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setProfileMsg({ text: '이름이 성공적으로 변경되었습니다.', isError: false });
        setTimeout(() => setProfileMsg({ text: '', isError: false }), 3000);
    };

    const handleLogout = async () => {
        setLogoutLoading(true); setLogoutMsg('');
        const token = localStorage.getItem('authToken')
        try {
            const result = await logout(token)
            if (!result?.success) setLogoutMsg(result?.message || '로그아웃 실패')
        } catch (error) {
            const message = error?.response?.data?.error?.message
            if (message) setLogoutMsg(message)
        } finally {
            localStorage.removeItem('authToken'); localStorage.removeItem('tokenType');
            localStorage.removeItem('tokenExpiresIn'); localStorage.removeItem('currentUser');
            setLogoutLoading(false); onLogout?.();
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwords.current || !passwords.next || !passwords.confirm) {
            setPwdMsg({ text: '모든 필드를 입력해주세요.', isError: true });
            return;
        }
        if (passwords.next !== passwords.confirm) {
            setPwdMsg({ text: '새 비밀번호가 일치하지 않습니다.', isError: true });
            return;
        }

        setPwdLoading(true);
        setPwdMsg({ text: '', isError: false });
        const savedToken = localStorage.getItem('authToken');

        try {
            const res = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${savedToken}`,
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.next,
                }),
            });
            const result = await res.json();

            if (result.success) {
                setPwdMsg({ text: '비밀번호가 성공적으로 변경되었습니다.', isError: false });
                setPasswords({ current: '', next: '', confirm: '' });
            } else {
                setPwdMsg({
                    text: result.error?.message || '비밀번호 변경에 실패했습니다.',
                    isError: true,
                });
            }
        } catch {
            setPwdMsg({ text: '서버 오류가 발생했습니다.', isError: true });
        } finally {
            setPwdLoading(false);
        }
    };

    const handleWithdraw = () => {
        const confirmFirst = window.confirm("정말로 탈퇴하시겠습니까? 탈퇴 시 모든 분석 데이터 및 파이프라인 정보가 영구 삭제되며 복구할 수 없습니다.");
        if (!confirmFirst) return;
        const confirmSecond = window.prompt("탈퇴를 확정하려면 '계정탈퇴'라고 정확히 입력해 주세요.");
        if (confirmSecond !== "계정탈퇴") { alert("입력 내용이 유효하지 않아 탈퇴가 취소되었습니다."); return; }
        alert("회원 탈퇴 처리가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
        localStorage.clear(); onLogout?.();
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 items-end mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✦</span>
                        <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">계정 설정</h1>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="px-3 py-1 bg-[#e6f0ff] dark:bg-blue-900/30 border border-[#bfdbfe] dark:border-blue-800 rounded-lg text-xs font-bold text-[#0066ff] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
                        Ready to Analyze
                    </div>
                </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* ACC-001 계정 정보 */}
            <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">ACC-001</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">계정 정보</h3>
                    </div>
                    <p className="text-xs text-slate-400">기본 프로필 정보 및 세션 관리</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">사용자 이름</label>
                        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                            placeholder="이름을 입력하세요"
                            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#0066ff] transition-all" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">이메일</label>
                        <input type="text" value={currentUser?.email || '-'} readOnly
                            className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-default" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">최근 로그인 시각</label>
                        <input type="text" value={formatDate(currentUser?.loginTime)} readOnly
                            className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-default" />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs font-semibold ${profileMsg.isError ? 'text-red-500' : 'text-emerald-500'}`}>{profileMsg.text}</span>
                    <div className="flex items-center gap-3">
                        {logoutMsg && <span className="text-xs font-semibold text-red-500">{logoutMsg}</span>}
                        <button type="button" onClick={handleLogout} disabled={logoutLoading}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50">
                            {logoutLoading ? '로그아웃 중...' : '로그아웃'}
                        </button>
                        <button type="submit"
                            className="px-4 py-2 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                            이름 저장
                        </button>
                    </div>
                </div>
            </form>

            {/* 비밀번호 변경 */}
            <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <Lock size={16} className="text-slate-400" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">비밀번호 변경</h3>
                    </div>
                    <p className="text-xs text-slate-400">보안 유지를 위해 비밀번호를 주기적으로 변경해 주세요.</p>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">현재 비밀번호</label>
                        <input type="password" placeholder="••••••••" value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0066ff] transition-all dark:text-white" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">새 비밀번호</label>
                            <input type="password" placeholder="••••••••" value={passwords.next}
                                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0066ff] transition-all dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">새 비밀번호 확인</label>
                            <input type="password" placeholder="••••••••" value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0066ff] transition-all dark:text-white" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs font-semibold ${pwdMsg.isError ? 'text-red-500' : 'text-emerald-500'}`}>{pwdMsg.text}</span>
                    <button type="submit" disabled={pwdLoading}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm disabled:opacity-50">
                        {pwdLoading ? '변경 중...' : '비밀번호 업데이트'}
                    </button>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle size={16} className="text-rose-500" />
                        <h3 className="text-base font-bold text-rose-900 dark:text-rose-400">위험 구역 (Danger Zone)</h3>
                    </div>
                    <p className="text-xs text-rose-600/80 dark:text-rose-500/80">계정 삭제 시 복구 불가능한 영구적인 조치가 취해집니다.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/50 rounded-xl">
                    <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Code AI 서비스 탈퇴</h4>
                        <p className="text-[11px] text-slate-400">워크스페이스 내의 모든 파이프라인 연동 데이터 및 계정 정보가 소멸됩니다.</p>
                    </div>
                    <button onClick={handleWithdraw}
                        className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm whitespace-nowrap">
                        계정 폐쇄 및 탈퇴
                    </button>
                </div>
            </div>
        </div>
    )
}