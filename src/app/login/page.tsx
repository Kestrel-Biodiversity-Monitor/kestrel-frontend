"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            await login(email, password);
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-text">🦅 KESTREL</div>
                    <div className="auth-logo-sub">Biodiversity Monitoring Platform</div>
                </div>
                <h1 className="auth-title">Sign in to your account</h1>
                <p className="auth-subtitle">Enter your credentials to access the platform</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input className="form-input" type="email" required value={email}
                            onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.com" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                            Password
                            <Link href="/forgot-password" style={{ color: "#2d7a55", fontWeight: 500 }}>Forgot password?</Link>
                        </label>
                        <input className="form-input" type="password" required value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                        {loading ? <><span className="spinner" />  Signing in...</> : "Sign In"}
                    </button>
                </form>

                <div className="auth-footer">
                    Don&apos;t have an account?{" "}
                    <Link href="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}
