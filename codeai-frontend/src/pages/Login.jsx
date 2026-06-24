import React, { useState } from "react";
import { login } from "../api/auth";
import CodiLogo from "../LOGO1.png";



const REGISTERED_USERS_KEY = "registeredUsers";

const getRegisteredUsers = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

function Login({ onLoginSuccess, onNavigateToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [activeModal, setActiveModal] = useState(null); // 'findId' | 'findPw' | null
    
    const [findIdEmail, setFindIdEmail] = useState("");
    
    const [findPwEmail, setFindPwEmail] = useState("");
    const [findPwName, setFindPwName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            alert("이메일과 비밀번호를 모두 입력해주세요.");
            return;
        }


        // 🔧 테스트용 임시 계정 (백엔드 연동 없이 바로 통과)
        if (email === "test@naver.com" && password === "test1234") {
            localStorage.setItem("authToken", "dev-fake-token");
            localStorage.setItem("tokenType", "Bearer");
            localStorage.setItem("tokenExpiresIn", "3600");

        const sessionUser = {
            username: "유저",
            email,
            loginTime: Date.now(),
            role: "USER" // 테스트 계정은 일반 유저로 설정
        };
        localStorage.setItem("currentUser", JSON.stringify(sessionUser));

        onLoginSuccess(sessionUser); // ← 위에서 만든 sessionUser 전달
        return;
    }

        try {
            setIsSubmitting(true);
            const result = await login({ email, password });
            const authData = result?.data;

            if (!result?.success || !authData?.accessToken) {
                alert(result?.message || "로그인에 실패했습니다.");
                return;
            }

            localStorage.setItem("authToken", authData.accessToken);
            localStorage.setItem("tokenType", authData.tokenType || "Bearer");
            localStorage.setItem("tokenExpiresIn", String(authData.expiresIn || 0));

            const sessionUser = {
                username: email.split("@")[0] || "사용자",
                email,
                loginTime: Date.now(),
                // 여기에 권한 정보를 추가합니다.
                role: authData.role || "USER",
            };
            localStorage.setItem("currentUser", JSON.stringify(sessionUser));

            alert(result?.message || "로그인 성공");
            onLoginSuccess(sessionUser); // ← sessionUser 전달
        } catch (error) {
            const message = error?.response
                ? (error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    "로그인 중 오류가 발생했습니다.")
                    : "백엔드 서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해주세요.";
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFindId = (e) => {
        e.preventDefault();
        if (!findIdEmail) {
            alert("이메일을 입력해주세요.");
            return;
        }

        const normalizedEmail = findIdEmail.trim().toLowerCase();
        const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        if (!isEmailFormatValid) {
            alert("올바른 이메일 형식으로 입력해주세요.");
            return;
        }

        const registeredUsers = getRegisteredUsers();
        const matchedUser = registeredUsers.find(
            (user) => (user.email || "").toLowerCase() === normalizedEmail
        );

        if (matchedUser?.username) {
            alert(`입력하신 이메일로 찾은 아이디는 [ ${matchedUser.username} ] 입니다.`);
            setActiveModal(null);
            setFindIdEmail("");
        } else {
            alert("입력하신 이메일과 일치하는 가입 정보가 없습니다.");
        }
    };

    const handleFindPw = (e) => {
        e.preventDefault();
        
        if (!findPwEmail || !findPwName || !newPassword || !confirmNewPassword) {
            alert("모든 빈칸을 채워주세요.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert("새로운 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            alert("비밀번호는 8자 이상이며, 영문 대문자/소문자/특수문자를 각각 1개 이상 포함해야 합니다.");
            return;
        }

        let existingUsers = JSON.parse(localStorage.getItem("users")) || [];
        const userIndex = existingUsers.findIndex(
            u => u.username === findPwEmail && u.name === findPwName
        );

        if (userIndex !== -1) {
            existingUsers[userIndex].password = newPassword;
            localStorage.setItem("users", JSON.stringify(existingUsers));
            
            alert("비밀번호가 성공적으로 재설정되었습니다! 새 비밀번호로 로그인해 주세요.");
            
            setActiveModal(null);
            setFindPwEmail("");
            setFindPwName("");
            setNewPassword("");
            setConfirmNewPassword("");
        } else {
            alert("입력하신 회원 정보(ID/이름)와 일치하는 계정이 존재하지 않습니다.");
        }
    };

return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 w-screen h-screen select-none font-sans antialiased relative">
            
            {/* 로고 영역 */}
            <div 
            className="px-6 py-5 border-b border-[#f1f5f9] flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setActiveTab('dashboard')}
            >
            <img src={CodiLogo} alt="Codi 로고" className="w-36 h-auto object-contain" />
            </div>

            <div className="w-full max-w-[460px] rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">로그인</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-b border-[#f1f5f9] px-4 py-3.5 text-base text-slate-900 focus:bg-slate-50 focus:outline-none placeholder-slate-400"
                            placeholder="이메일"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 text-base text-slate-900 focus:bg-slate-50 focus:outline-none placeholder-slate-400"
                            placeholder="비밀번호"
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-[#0066ff] focus:ring-0" />
                            로그인 상태 유지
                        </label>
                        <div>IP보안 <span className="text-[#0066ff] font-bold">ON</span></div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-[#0066ff] py-3.5 text-lg font-bold text-white shadow-sm hover:bg-blue-700 transition-colors mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "로그인 중..." : "로그인"}
                    </button>
                </form>
            </div>

            <div className="mt-6 flex gap-4 text-xs font-medium text-slate-500">
                <button type="button" onClick={() => setActiveModal("findId")} className="hover:text-slate-800">아이디 찾기</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={() => setActiveModal("findPw")} className="hover:text-slate-800">비밀번호 찾기</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={onNavigateToRegister} className="font-bold text-[#0066ff] hover:underline">회원가입</button>
            </div>

            {activeModal === "findId" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">아이디 찾기</h3>
                        <p className="text-xs text-slate-400 mb-4">가입할 때 입력한 이메일을 적어주세요.</p>
                        
                        <form onSubmit={handleFindId} className="space-y-4">
                            <input
                                type="email"
                                value={findIdEmail}
                                onChange={(e) => setFindIdEmail(e.target.value)}
                                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0066ff]"
                                placeholder="이메일 입력 (예: user@example.com)"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">취소</button>
                                <button type="submit" className="flex-1 rounded-xl bg-[#0066ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700">찾기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeModal === "findPw" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">비밀번호 재설정</h3>
                        <p className="text-xs text-slate-400 mb-4">계정 정보 확인 후 새 비밀번호를 설정합니다.</p>
                        
                        <form onSubmit={handleFindPw} className="space-y-3">
                            <input
                                type="text"
                                value={findPwEmail}
                                onChange={(e) => setFindPwEmail(e.target.value)}
                                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0066ff]"
                                placeholder="ID (아이디)"
                            />
                            <input
                                type="text"
                                value={findPwName}
                                onChange={(e) => setFindPwName(e.target.value)}
                                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0066ff]"
                                placeholder="이름"
                            />
                            <div className="border-t border-slate-100 my-2 pt-2 space-y-3">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0066ff]"
                                    placeholder="새로운 비밀번호 입력"
                                />
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0066ff]"
                                    placeholder="새로운 비밀번호 확인"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">취소</button>
                                <button type="submit" className="flex-1 rounded-xl bg-[#0066ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700">변경하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Login;