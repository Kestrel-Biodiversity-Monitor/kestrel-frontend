"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", organization: "" });
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
            setError(err.response?.data?.message || "Registration failed");
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
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join our global network of biodiversity researchers</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" required value={form.name} onChange={set("name")} placeholder="Jane Smith" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Organization <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                            <input className="form-input" value={form.organization} onChange={set("organization")} placeholder="Wildlife Foundation" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input className="form-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@organization.com" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" required value={form.password} onChange={set("password")} placeholder="Min. 6 characters" minLength={6} />
                    </div>
                    <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                        {loading ? <><span className="spinner" /> Creating account...</> : "Create Account"}
                    </button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
