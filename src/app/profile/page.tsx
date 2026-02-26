"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { toast } from "react-toastify";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", organization: user?.organization || "" });
    const [upgradeReason, setUpgradeReason] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState(false);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (image) fd.append("profileImage", image);
            await api.put("/auth/profile", fd, { headers: { "Content-Type": "multipart/form-data" } });
            await refreshUser();
            toast.success("Profile updated!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpgradeLoading(true);
        try {
            await api.post("/auth/request-role-upgrade", { reason: upgradeReason });
            toast.success("Role upgrade request submitted! An admin will review it.");
            setUpgradeReason("");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Request failed");
        } finally {
            setUpgradeLoading(false);
        }
    };

    if (!user) return null;

    const IMG_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div style={{ padding: "28px", maxWidth: 760 }}>
                        <div className="page-header">
                            <div><h1 className="page-title">Your Profile</h1><p className="page-subtitle">Manage your account and settings</p></div>
                        </div>

                        {/* Profile Card */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
                                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: "3px solid #d1eadc", flexShrink: 0, overflow: "hidden" }}>
                                    {user.profileImage
                                        ? <img src={`${IMG_URL}${user.profileImage}`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : "👤"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{user.name}</div>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>{user.email}</div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                        <span className={`badge badge-${user.role}`}>{user.role}</span>
                                        <span style={{ fontSize: 12, color: "#6b7280" }}>🏆 {user.contributionScore} pts</span>
                                        {user.organization && <span style={{ fontSize: 12, color: "#6b7280" }}>🏢 {user.organization}</span>}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate}>
                                <div className="grid-2">
                                    <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={set("name")} /></div>
                                    <div className="form-group"><label className="form-label">Organization</label><input className="form-input" value={form.organization} onChange={set("organization")} placeholder="Wildlife Foundation..." /></div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bio</label>
                                    <textarea className="form-textarea" value={form.bio} onChange={set("bio")} placeholder="Tell the community about yourself..." style={{ minHeight: 90 }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Profile Photo <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional, max 5MB)</span></label>
                                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} style={{ fontSize: 13 }} />
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={loading}>
                                    {loading ? <><span className="spinner" /> Saving...</> : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        {/* Role Upgrade */}
                        {user.role === "user" && (
                            <div className="card">
                                <div className="card-header"><span className="card-title">Researcher Access Request</span></div>
                                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                                    {user.roleUpgradeRequest
                                        ? "✅ Your researcher upgrade request is pending admin approval."
                                        : "Request Researcher access to submit more detailed reports and access advanced features."}
                                </p>
                                {!user.roleUpgradeRequest && (
                                    <form onSubmit={handleRoleRequest}>
                                        <div className="form-group">
                                            <label className="form-label">Why do you need Researcher access?</label>
                                            <textarea className="form-textarea" required value={upgradeReason} onChange={(e) => setUpgradeReason(e.target.value)} placeholder="Describe your research work, affiliation, and intended use..." style={{ minHeight: 90 }} />
                                        </div>
                                        <button className="btn btn-secondary" type="submit" disabled={upgradeLoading}>
                                            {upgradeLoading ? <><span className="spinner" style={{ borderTopColor: "#374151", borderColor: "rgba(0,0,0,0.1)" }} /> Submitting...</> : "Submit Request"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="card" style={{ marginTop: 20 }}>
                            <div className="card-header"><span className="card-title">Account Stats</span></div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                                {[
                                    { label: "Contribution Score", value: user.contributionScore, icon: "🏆" },
                                    { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }), icon: "📅" },
                                    { label: "Account Status", value: user.isActive ? "Active" : "Inactive", icon: user.isActive ? "✅" : "⛔" },
                                ].map((s) => (
                                    <div key={s.label} style={{ textAlign: "center", padding: "16px 8px", background: "#f9fafb", borderRadius: 8 }}>
                                        <div style={{ fontSize: 24 }}>{s.icon}</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginTop: 6 }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
