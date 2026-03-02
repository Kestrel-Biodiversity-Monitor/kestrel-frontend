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
    const initials = user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">Your Profile</div>
                            <div className="topbar-subtitle">Manage your account and settings</div>
                        </div>
                    </div>

                    <div className="page-wrapper" style={{ maxWidth: 780 }}>

                        {/* Profile Hero Card */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            {/* Avatar + bio strip */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 22, marginBottom: 28,
                                padding: "20px 22px", margin: "-22px -22px 24px",
                                background: "linear-gradient(135deg, #0d2b1a 0%, #1a4731 60%, #225e40 100%)",
                                borderRadius: "14px 14px 0 0",
                            }}>
                                <div style={{
                                    width: 78, height: 78, borderRadius: "50%",
                                    background: "linear-gradient(135deg, #3d9a6a, #5cb887)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 28, fontWeight: 800, color: "white",
                                    border: "3px solid rgba(255,255,255,0.25)",
                                    flexShrink: 0, overflow: "hidden",
                                    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                                }}>
                                    {user.profileImage
                                        ? <img src={`${IMG_URL}${user.profileImage}`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : initials}
                                </div>
                                <div>
                                    <div style={{ fontSize: 21, fontWeight: 800, color: "white", fontFamily: "Plus Jakarta Sans, sans-serif", letterSpacing: "-0.4px" }}>{user.name}</div>
                                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{user.email}</div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                                        <span className={`badge badge-${user.role}`}>{user.role}</span>
                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4 }}>🏆 {user.contributionScore} pts</span>
                                        {user.organization && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 4 }}>🏢 {user.organization}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Edit Form */}
                            <div className="section-label" style={{ marginBottom: 20 }}>
                                <span className="section-label-text">Edit Profile</span>
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
                                    <label className="form-label">Profile Photo <span className="form-hint">(optional, max 5MB)</span></label>
                                    <div className="file-input-wrap" style={{ position: "relative" }}>
                                        <div style={{ fontSize: 26, marginBottom: 4 }}>📷</div>
                                        <div style={{ fontSize: 13, color: "#6b7280" }}>{image ? image.name : "Click to choose a profile photo"}</div>
                                        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                                    </div>
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={loading}>
                                    {loading ? <><span className="spinner" /> Saving...</> : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        {/* Researcher Role Upgrade */}
                        {user.role === "user" && (
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-header">
                                    <span className="card-title">Researcher Access Request</span>
                                    {user.roleUpgradeRequest && <span className="badge badge-pending">Pending</span>}
                                </div>
                                <p style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 18, lineHeight: 1.6 }}>
                                    {user.roleUpgradeRequest
                                        ? "✅ Your researcher upgrade request is under admin review."
                                        : "Request Researcher access to submit detailed reports and unlock advanced analytics features."}
                                </p>
                                {!user.roleUpgradeRequest && (
                                    <form onSubmit={handleRoleRequest}>
                                        <div className="form-group">
                                            <label className="form-label">Why do you need Researcher access?</label>
                                            <textarea className="form-textarea" required value={upgradeReason} onChange={(e) => setUpgradeReason(e.target.value)} placeholder="Describe your research work, affiliation, and intended use..." style={{ minHeight: 90 }} />
                                        </div>
                                        <button className="btn btn-secondary" type="submit" disabled={upgradeLoading}>
                                            {upgradeLoading ? <><span className="spinner-dark" /> Submitting...</> : "Submit Request"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Account Stats */}
                        <div className="card">
                            <div className="card-header"><span className="card-title">Account Stats</span></div>
                            <div className="grid-3">
                                {[
                                    { label: "Contribution Score", value: user.contributionScore, icon: "🏆", color: "#fef9c3", border: "#fde68a" },
                                    { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }), icon: "📅", color: "#eff6ff", border: "#bfdbfe" },
                                    { label: "Account Status", value: user.isActive ? "Active" : "Inactive", icon: user.isActive ? "✅" : "⛔", color: user.isActive ? "#f0fdf4" : "#fef2f2", border: user.isActive ? "#bbf7d0" : "#fecaca" },
                                ].map((s) => (
                                    <div key={s.label} style={{ textAlign: "center", padding: "20px 12px", background: s.color, borderRadius: 12, border: `1px solid ${s.border}` }}>
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", fontFamily: "Plus Jakarta Sans, sans-serif", letterSpacing: "-0.5px" }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
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
