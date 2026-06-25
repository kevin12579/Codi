import axios from "axios";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();
const authBaseUrl = configuredApiUrl ? `${configuredApiUrl}/auth` : "/api/auth";

const authClient = axios.create({
    baseURL: authBaseUrl,
    timeout: 10000,
});

// 🔥 ngrok 경고 페이지 우회 헤더 설정을 위한 인터셉터 추가
authClient.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers['ngrok-skip-browser-warning'] = 'true'; 
    return config;
});

export const signup = async ({ email, password }) => {
    const response = await authClient.post("/signup", { email, password });
    return response.data;
};

export const login = async ({ email, password }) => {
    const response = await authClient.post("/login", { email, password });
    return response.data;
};

export const logout = async (token) => {
    const response = await authClient.post(
        "/logout",
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};