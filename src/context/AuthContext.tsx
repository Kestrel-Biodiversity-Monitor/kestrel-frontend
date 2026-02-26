"use client";

import {
    createContext, useContext, useState, useEffect, ReactNode,
} from "react";
import { User } from "@/types";
import api from "@/lib/api";
import { auth } from "@/lib/auth";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, organization?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const res = await api.get<{ user: User }>("/auth/me");
            setUser(res.data.user);
        } catch {
            auth.removeToken();
            setUser(null);
            setToken(null);
        }
    };

    useEffect(() => {
        const saved = auth.getToken();
        if (saved) {
            setToken(saved);
            api.get<{ user: User }>("/auth/me")
                .then((res) => setUser(res.data.user))
                .catch(() => { auth.removeToken(); })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
        auth.setToken(res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
    };

    const register = async (name: string, email: string, password: string, organization?: string) => {
        const res = await api.post<{ user: User; token: string }>("/auth/register", { name, email, password, organization });
        auth.setToken(res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        auth.removeToken();
        setToken(null);
        setUser(null);
        if (typeof window !== "undefined") window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
