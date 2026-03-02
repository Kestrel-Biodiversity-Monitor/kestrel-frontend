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

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", organization: "" });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setLoading(true); setError("");
        try {
            await register(form.name, form.email, form.password, form.organization);
            toast.success("Account created! Welcome to KESTREL.");
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
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
                    Join a Global Network<br />
                    of Conservationists.
                </h2>
                <p className="auth-brand-desc">
                    Connect with thousands of researchers and field scientists contributing to the world's
                    most comprehensive biodiversity database. Every observation matters.
                </p>

                <div className="auth-brand-features">
                    {[
                        "Contribute species observations",
                        "Collaborate with researchers worldwide",
                        "Access conservation dashboards",
                        "Build your scientific profile",
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
                        <div className="auth-logo-text">Create account 🌿</div>
                        <div className="auth-logo-sub">KESTREL · Biodiversity Monitoring</div>
                    </div>

                    <h1 className="auth-title">Join our platform</h1>
                    <p className="auth-subtitle">Start documenting biodiversity observations today</p>

                    {error && (
                        <div className="auth-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" required value={form.name} onChange={set("name")} placeholder="Jane Smith" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Organization <span className="form-hint">(optional)</span>
                                </label>
                                <input className="form-input" value={form.organization} onChange={set("organization")} placeholder="Wildlife Foundation" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input className="form-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@organization.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password <span className="form-hint">(min. 6 characters)</span></label>
                            <div className="input-with-action">
                                <input
                                    className="form-input" type={showPw ? "text" : "password"} required
                                    value={form.password} onChange={set("password")} placeholder="••••••••" minLength={6}
                                />
                                <button type="button" className="input-action-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                                    <EyeIcon open={showPw} />
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                            {loading ? <><span className="spinner" /> Creating account...</> : "Create Account →"}
                        </button>
                    </form>
                    <div className="auth-footer">
                        Already have an account? <Link href="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
