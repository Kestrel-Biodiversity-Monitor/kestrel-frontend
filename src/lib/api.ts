import axios from "axios";
import { auth } from "./auth";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    withCredentials: false,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
    const token = auth.getToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
            auth.removeToken();
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default api;
