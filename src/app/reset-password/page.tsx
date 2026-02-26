"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "react-toastify";

function ResetForm() {
    const sp = useSearchParams();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const token = sp.get("token") || "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { setError("Passwords do not match"); return; }
        setLoading(true); setError("");
        try {
            await api.post("/auth/reset-password", { token, password });
            toast.success("Password reset! Please login.");
            router.push("/login");
        } catch (err: any) {
            setError(err.response?.data?.message || "Reset failed – link may have expired");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" minLength={6} />
            </div>
            <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading || !token}>
                {loading ? <><span className="spinner" /> Resetting...</> : "Set New Password"}
            </button>
            {!token && <p className="form-error" style={{ marginTop: 8 }}>Invalid reset link</p>}
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-text">🦅 KESTREL</div>
                    <div className="auth-logo-sub">Biodiversity Monitoring Platform</div>
                </div>
                <h1 className="auth-title">Set new password</h1>
                <p className="auth-subtitle">Choose a strong new password for your account</p>
                <Suspense fallback={<p style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</p>}>
                    <ResetForm />
                </Suspense>
                <div className="auth-footer">
                    <Link href="/login">← Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
}
