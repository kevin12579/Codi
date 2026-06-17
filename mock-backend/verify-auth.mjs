const base = "http://localhost:8080";
const email = `mock${Date.now()}@example.com`;
const password = "password123";

const postJson = async (path, body, headers = {}) => {
    const response = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        ...headers,
        },
        body: JSON.stringify(body ?? {}),
    });

    const text = await response.text();
    return { status: response.status, text };
    };

    const run = async () => {
    const signup = await postJson("/api/auth/signup", { email, password });
    console.log("[SIGNUP]", signup.status, signup.text);

    const login = await postJson("/api/auth/login", { email, password });
    console.log("[LOGIN]", login.status, login.text);

    const loginJson = JSON.parse(login.text);
    const token = loginJson?.data?.accessToken;

    const logout = await postJson("/api/auth/logout", {}, { Authorization: `Bearer ${token}` });
    console.log("[LOGOUT]", logout.status, logout.text);

    const invalidLogout = await postJson("/api/auth/logout", {}, { Authorization: "Bearer invalid.token" });
    console.log("[LOGOUT_INVALID]", invalidLogout.status, invalidLogout.text);
    };

    run().catch((error) => {
    console.error("[VERIFY_ERROR]", error.message);
    process.exit(1);
});
