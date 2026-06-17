import http from "node:http";
import { randomBytes } from "node:crypto";

const PORT = 8080;
const users = new Map();
const activeTokens = new Set();
let sequenceId = 1;

const sendJson = (res, statusCode, payload) => {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(payload));
    };

    const readJsonBody = (req) =>
    new Promise((resolve, reject) => {
        let raw = "";

        req.on("data", (chunk) => {
        raw += chunk;
        if (raw.length > 1_000_000) {
            reject(new Error("Payload too large"));
        }
        });

        req.on("end", () => {
        if (!raw) {
            resolve({});
            return;
        }

        try {
            resolve(JSON.parse(raw));
        } catch (error) {
            reject(new Error("Invalid JSON"));
        }
        });

        req.on("error", reject);
    });

    const createMockToken = () => `mock.${randomBytes(12).toString("hex")}`;

    const handleSignup = async (req, res) => {
    const body = await readJsonBody(req);
    const username = String(body.username || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
        sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: "AUTH_BAD_REQUEST", message: "이메일과 비밀번호를 입력해주세요." },
        });
        return;
    }

    if (users.has(email)) {
        sendJson(res, 409, {
        success: false,
        data: null,
        error: { code: "AUTH_EMAIL_EXISTS", message: "이미 가입된 이메일입니다." },
        });
        return;
    }

    const createdAt = new Date().toISOString().replace(".000Z", "");
    const user = {
        id: sequenceId,
        username,
        name,
        email,
        password,
        createdAt,
    };
    sequenceId += 1;
    users.set(email, user);

    sendJson(res, 201, {
        success: true,
        data: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        },
        message: "회원가입 완료",
    });
    };

    const handleResetPassword = async (req, res) => {
    const body = await readJsonBody(req);
    const username = String(body.username || "").trim();
    const name = String(body.name || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!username || !name || !newPassword) {
        sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: "AUTH_BAD_REQUEST", message: "아이디, 이름, 새 비밀번호를 입력해주세요." },
        });
        return;
    }

    const matchedUser = Array.from(users.values()).find(
        (user) => (user.username || "") === username && (user.name || "") === name
    );

    if (!matchedUser) {
        sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: "AUTH_USER_NOT_FOUND", message: "입력하신 회원 정보(ID/이름)와 일치하는 계정이 존재하지 않습니다." },
        });
        return;
    }

    matchedUser.password = newPassword;

    sendJson(res, 200, {
        success: true,
        data: null,
        message: "비밀번호가 성공적으로 재설정되었습니다! 새 비밀번호로 로그인해 주세요.",
    });
    };

    const handleLogin = async (req, res) => {
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
        sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: "AUTH_BAD_REQUEST", message: "이메일과 비밀번호를 입력해주세요." },
        });
        return;
    }

    const user = users.get(email);
    if (!user || user.password !== password) {
        sendJson(res, 401, {
        success: false,
        data: null,
        error: { code: "AUTH_CREDENTIALS_INVALID", message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        });
        return;
    }

    const accessToken = createMockToken();
    activeTokens.add(accessToken);

    sendJson(res, 200, {
        success: true,
        data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 86400,
        },
        message: "로그인 성공",
    });
    };

    const handleLogout = (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token || !activeTokens.has(token)) {
        sendJson(res, 401, {
        success: false,
        data: null,
        error: { code: "AUTH_TOKEN_INVALID", message: "유효하지 않은 토큰입니다." },
        });
        return;
    }

    activeTokens.delete(token);
    sendJson(res, 200, {
        success: true,
        data: null,
        message: "로그아웃 완료",
    });
    };

    const server = http.createServer(async (req, res) => {
    try {
        if (req.method === "GET" && req.url === "/") {
        sendJson(res, 200, { ok: true, service: "mock-auth-api", port: PORT });
        return;
        }

        if (req.method === "POST" && req.url === "/api/auth/signup") {
        await handleSignup(req, res);
        return;
        }

        if (req.method === "POST" && req.url === "/api/auth/login") {
        await handleLogin(req, res);
        return;
        }

        if (req.method === "POST" && req.url === "/api/auth/logout") {
        handleLogout(req, res);
        return;
        }

        if (req.method === "POST" && req.url === "/api/auth/reset-password") {
        await handleResetPassword(req, res);
        return;
        }

        sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "요청한 경로를 찾을 수 없습니다." },
        });
    } catch (error) {
        sendJson(res, 500, {
        success: false,
        data: null,
        error: { code: "MOCK_SERVER_ERROR", message: "Mock 서버 내부 오류" },
        });
    }
    });

    server.listen(PORT, () => {
    console.log(`[mock-api] running at http://localhost:${PORT}`);
});
