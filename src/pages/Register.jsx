import React, { useState } from "react";
import { signup } from "../api/auth";

const REGISTERED_USERS_KEY = "registeredUsers";

const getRegisteredUsers = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

function Register({ onNavigateToLogin }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmailTakenByServer, setIsEmailTakenByServer] = useState(false);
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const registeredUsersSnapshot = getRegisteredUsers();
    const isUsernameValid = username.length >= 3 && username.length <= 15;
    const isDuplicateUsername = normalizedUsername
        ? registeredUsersSnapshot.some((user) => (user.username || "").toLowerCase() === normalizedUsername)
        : false;
    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const isDuplicateEmail = normalizedEmail
        ? registeredUsersSnapshot.some((user) => (user.email || "").toLowerCase() === normalizedEmail)
        : false;
    const isEmailUnavailable = isDuplicateEmail || isEmailTakenByServer;
    const isLengthValid = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordSecure = isLengthValid && hasUpperCase && hasLowerCase && hasSpecialChar;
    const isPasswordMatched = password && password === confirmPassword;

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!username || !email || !name || !password || !confirmPassword) {
        alert("모든 빈칸을 채워주세요.");
        return;
        }

        if (!isUsernameValid) {
        alert("아이디는 3자 이상 15자 이하로 입력해주세요.");
        return;
        }

        if (!isEmailFormatValid) {
        alert("올바른 이메일 형식으로 입력해주세요.");
        return;
        }

        if (!isPasswordSecure) {
        alert("비밀번호 요건(8자 이상, 영문 대·소문자, 특수문자 포함)을 모두 충족해야 합니다.");
        return;
        }

        if (!isPasswordMatched) {
        alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
        }

        const registeredUsers = getRegisteredUsers();

        const isDuplicateUsernameOnSubmit = registeredUsers.some(
            (user) => (user.username || "").toLowerCase() === normalizedUsername
        );
        if (isDuplicateUsernameOnSubmit) {
            alert("이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.");
            return;
        }

        const isDuplicateEmailOnSubmit = registeredUsers.some(
            (user) => (user.email || "").toLowerCase() === normalizedEmail
        );
        if (isDuplicateEmailOnSubmit || isEmailTakenByServer) {
            alert("이미 사용 중인 이메일 주소입니다. 다른 이메일을 입력해주세요.");
            return;
        }

        try {
        setIsSubmitting(true);
        const result = await signup({ email: normalizedEmail, password });

        if (!result?.success) {
            alert(result?.message || "회원가입에 실패했습니다.");
            return;
        }

        const nextUsers = [
            ...registeredUsers,
            {
                username: username.trim(),
                email: normalizedEmail,
                name: name.trim(),
                password,
                createdAt: new Date().toISOString(),
            },
        ];
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(nextUsers));

        alert(result?.message || "회원가입이 성공적으로 완료되었습니다! 로그인 페이지로 이동합니다.");
        onNavigateToLogin();
        } catch (error) {
                const errorCode = error?.response?.data?.error?.code;
                const serverMessage =
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    "회원가입 중 오류가 발생했습니다.";

                if (errorCode === "AUTH_EMAIL_EXISTS" || /이미\s*(가입|사용)/.test(serverMessage)) {
                    setIsEmailTakenByServer(true);
                    const nextUsers = [
                        ...registeredUsers,
                        {
                            username: username.trim(),
                            email: normalizedEmail,
                            name: name.trim(),
                            password,
                            createdAt: new Date().toISOString(),
                        },
                    ];
                    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(nextUsers));
                }

                const message = error?.response
                        ? serverMessage
                        : "백엔드 서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해주세요. (http://localhost:8080)";
        alert(message);
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 w-screen h-screen select-none font-sans antialiased">
        
        <div className="mb-6 text-center">
            <h1 
                onClick={() => window.location.reload()} 
                className="text-4xl font-black tracking-tight text-[#0066ff] cursor-pointer"
            >
                Code AI
            </h1>
        </div>

        <div className="w-full max-w-[460px] rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-1">회원가입</h2>
            <p className="text-xs text-slate-400 mb-6">플랫폼 서비스를 이용하기 위한 필수 계정을 생성합니다.</p>
            
            <form onSubmit={handleRegister} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">ID (아이디)</label>
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 bg-white focus:bg-slate-50 focus:border-[#0066ff] focus:outline-none placeholder-slate-400"
                placeholder="사용할 아이디 입력"
                />
                
                {username && (
                <div className="mt-1.5 text-xs font-medium">
                    {isUsernameValid ? (
                    <p className="text-emerald-600">✓ 사용 가능한 글자 수입니다 (3자~15자).</p>
                    ) : (
                    <p className="text-rose-500">✗ 아이디는 3자 이상 15자 이하로 입력해야 합니다.</p>
                    )}

                    {isUsernameValid && (
                    isDuplicateUsername ? (
                    <p className="text-rose-500 mt-1">✗ 이미 사용 중인 아이디입니다.</p>
                    ) : (
                    <p className="text-emerald-600 mt-1">✓ 사용 가능한 아이디입니다.</p>
                    )
                    )}
                </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">이메일 주소</label>
                <input
                type="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailTakenByServer(false);
                }}
                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 bg-white focus:bg-slate-50 focus:border-[#0066ff] focus:outline-none placeholder-slate-400"
                placeholder="example@domain.com"
                />

                {email && (
                <div className="mt-1.5 text-xs font-medium">
                    {!isEmailFormatValid ? (
                    <p className="text-rose-500">✗ 올바른 이메일 형식이 아닙니다.</p>
                    ) : isEmailUnavailable ? (
                    <p className="text-rose-500">✗ 이미 사용 중인 이메일입니다.</p>
                    ) : (
                    <p className="text-slate-500">• 형식이 올바른 이메일입니다. 중복 여부는 가입 시 서버에서 최종 확인됩니다.</p>
                    )}
                </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">이름</label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 bg-white focus:bg-slate-50 focus:border-[#0066ff] focus:outline-none placeholder-slate-400"
                placeholder="이름 입력 (예: 홍길동)"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">비밀번호</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 bg-white focus:bg-slate-50 focus:border-[#0066ff] focus:outline-none placeholder-slate-400"
                placeholder="비밀번호 설정"
                />
                
                {password && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className={`flex items-center gap-1 font-medium ${isLengthValid ? "text-emerald-600" : "text-rose-500"}`}>
                    {isLengthValid ? "✓" : "✗"} 8자 이상
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${hasUpperCase ? "text-emerald-600" : "text-rose-500"}`}>
                    {hasUpperCase ? "✓" : "✗"} 영문 대문자
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${hasLowerCase ? "text-emerald-600" : "text-rose-500"}`}>
                    {hasLowerCase ? "✓" : "✗"} 영문 소문자
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${hasSpecialChar ? "text-emerald-600" : "text-rose-500"}`}>
                    {hasSpecialChar ? "✓" : "✗"} 특수문자
                    </span>
                </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">비밀번호 확인</label>
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm text-slate-900 bg-white focus:bg-slate-50 focus:border-[#0066ff] focus:outline-none placeholder-slate-400"
                placeholder="비밀번호 재입력"
                />
                
                {confirmPassword && (
                <div className="mt-1.5 text-xs font-medium">
                    {isPasswordMatched ? (
                    <p className="text-emerald-600">✓ 비밀번호가 완벽히 일치합니다.</p>
                    ) : (
                    <p className="text-rose-500">✗ 비밀번호가 일치하지 않습니다.</p>
                    )}
                </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#0066ff] py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-700 transition-colors mt-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "가입 처리 중..." : "동의하고 가입하기"}
            </button>
            </form>

            <div className="mt-5 text-center border-t border-[#f1f5f9] pt-4">
            <button 
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs font-semibold text-[#0066ff] hover:underline"
            >
                이미 계정이 있으신가요? 로그인하러 가기
            </button>
            </div>
        </div>
        </div>
    );
}

export default Register;