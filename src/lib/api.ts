import axios from "axios";
import { auth } from "./auth";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://kestrel-api-temp.loca.lt/api",
    withCredentials: true,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
    const token = auth.getToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    
    // Bypass localtunnel warning page
    config.headers["Bypass-Tunnel-Reminder"] = "true";
    
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
