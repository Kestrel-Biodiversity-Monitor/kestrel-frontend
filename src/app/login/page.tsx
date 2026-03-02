"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
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
            setError(err.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left Brand Panel */}
            <div className="auth-brand">
                <div className="auth-brand-logo">
                    <div className="auth-brand-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L4 8v4l4-2v4l4 4 4-4v-4l4 2V8L12 2z" fill="white" opacity="0.95" />
                            <path d="M12 14l-3 3h6l-3-3z" fill="white" opacity="0.65" />
                        </svg>
                    </div>
                    <div>
                        <div className="auth-brand-name">KESTREL</div>
                        <div className="auth-brand-tagline">Biodiversity Platform</div>
                    </div>
                </div>

                <h2 className="auth-brand-headline">
                    Monitor Nature.<br />
                    Protect the Future.
                </h2>
                <p className="auth-brand-desc">
                    A collaborative platform for ecologists, researchers, and citizen scientists to document
                    biodiversity, track threatened species, and generate insights for conservation action.
                </p>

                <div className="auth-brand-features">
                    {[
                        "Real-time biodiversity mapping",
                        "AI-assisted species identification",
                        "Community ecological reporting",
                        "Conservation risk analytics",
                    ].map((f) => (
                        <div key={f} className="auth-brand-feature">
                            <span className="auth-brand-feature-dot" />
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="auth-right">
                <div className="auth-card animate-fade-up">
                    <div className="auth-logo">
                        <div className="auth-logo-text">Welcome back 👋</div>
                        <div className="auth-logo-sub">KESTREL · Biodiversity Monitoring</div>
                    </div>

                    <h1 className="auth-title">Sign in to your account</h1>
                    <p className="auth-subtitle">Enter your credentials to continue</p>

                    {error && (
                        <div className="auth-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                className="form-input" type="email" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@organization.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                                Password
                                <Link href="/forgot-password" style={{ color: "var(--forest-500)", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                                    Forgot password?
                                </Link>
                            </label>
                            <div className="input-with-action">
                                <input
                                    className="form-input" type={showPw ? "text" : "password"} required
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="button" className="input-action-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                                    <EyeIcon open={showPw} />
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                            {loading ? <><span className="spinner" /> Signing in...</> : "Sign In →"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don&apos;t have an account?{" "}
                        <Link href="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
