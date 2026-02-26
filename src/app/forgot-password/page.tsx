"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage(""); setError("");
        try {
            const res = await api.post("/auth/forgot-password", { email });
            setMessage(res.data.message);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong");
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
                <h1 className="auth-title">Reset your password</h1>
                <p className="auth-subtitle">Enter your email and we'll send a reset link</p>

                {message && <div className="auth-success">{message}</div>}
                {error && <div className="auth-error">{error}</div>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input className="form-input" type="email" required value={email}
                                onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.com" />
                        </div>
                        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                            {loading ? <><span className="spinner" /> Sending...</> : "Send Reset Link"}
                        </button>
                    </form>
                )}
                <div className="auth-footer">
                    <Link href="/login">← Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
}
