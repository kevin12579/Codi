import axios from "axios";

const authClient = axios.create({
    baseURL: "/api/auth",
    timeout: 10000,
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
