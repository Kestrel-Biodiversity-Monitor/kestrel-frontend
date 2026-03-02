"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { Document } from "@/types";
import { toast } from "react-toastify";

const FILE_ICONS: Record<string, string> = {
    pdf: "📄", csv: "📊", image: "🖼️", doc: "📝", other: "📎",
};

function formatSize(bytes?: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", tags: "" });
    const fileRef = useRef<HTMLInputElement>(null);
    const [statusFilter, setStatusFilter] = useState("");

    const canUpload = user?.role === "officer" || user?.role === "admin";

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? `?status=${statusFilter}` : "";
            const res = await api.get(`/documents${params}`);
            setDocuments(res.data.documents);
        } catch {
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDocuments(); }, [statusFilter]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileRef.current?.files?.[0]) return toast.error("Please select a file");
        if (!form.title.trim()) return toast.error("Title is required");
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", fileRef.current.files[0]);
            fd.append("title", form.title);
            fd.append("description", form.description);
            fd.append("tags", form.tags);
            await api.post("/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("Document uploaded — pending admin approval");
            setShowUpload(false);
            setForm({ title: "", description: "", tags: "" });
            if (fileRef.current) fileRef.current.value = "";
            loadDocuments();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const statusColor: Record<string, string> = {
        approved: "#16a34a", pending: "#ca8a04", rejected: "#dc2626",
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">Documents</div>
                            <div className="topbar-subtitle">
                                {user?.role === "user" ? "Browse approved documents" : "Manage uploaded documents"}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            {canUpload && (
                                <>
                                    <select
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        style={{ fontSize: 13, padding: "6px 10px", minWidth: 140 }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
                                        + Upload Document
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="page-wrapper">
                        {/* Upload Form */}
                        {showUpload && canUpload && (
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-header">
                                    <span className="card-title">Upload New Document</span>
                                    <button className="btn btn-sm btn-ghost" onClick={() => setShowUpload(false)}>✕</button>
                                </div>
                                <form onSubmit={handleUpload}>
                                    <div className="grid-2" style={{ marginBottom: 12 }}>
                                        <div className="form-group">
                                            <label className="form-label">Title *</label>
                                            <input className="form-input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Document title" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Tags (comma separated)</label>
                                            <input className="form-input" value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="wildlife, survey, 2024" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-textarea" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this document..." style={{ minHeight: 72 }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">File * (PDF, CSV, Image, DOC)</label>
                                        <input ref={fileRef} type="file" className="form-input" accept=".pdf,.csv,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt" />
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                                            {uploading ? "Uploading..." : "Upload"}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Documents Table */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">
                                    {user?.role === "user" ? "Approved Documents" : `Documents (${documents.length})`}
                                </span>
                            </div>
                            {loading ? (
                                <div style={{ padding: 40, textAlign: "center" }}>
                                    <div className="spinner" style={{ borderColor: "rgba(26,71,49,0.3)", borderTopColor: "#1a4731", width: 32, height: 32, margin: "0 auto" }} />
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="empty-state" style={{ padding: 60 }}>
                                    <div className="empty-state-icon">📂</div>
                                    <div className="empty-state-text">No documents found</div>
                                    <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                                        {canUpload ? "Upload the first document above" : "No approved documents available yet"}
                                    </div>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>File</th>
                                            <th>Title</th>
                                            <th>Uploaded By</th>
                                            <th>Size</th>
                                            <th>Tags</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => (
                                            <tr key={doc._id}>
                                                <td style={{ fontSize: 20 }}>{FILE_ICONS[doc.fileType] || "📎"}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{doc.title}</div>
                                                    {doc.description && <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{doc.description.slice(0, 60)}{doc.description.length > 60 ? "…" : ""}</div>}
                                                </td>
                                                <td style={{ fontSize: 12, color: "#374151" }}>
                                                    {doc.uploadedBy?.name || "—"}
                                                    <div style={{ color: "#9ca3af", fontSize: 11 }}>{doc.uploadedBy?.role}</div>
                                                </td>
                                                <td style={{ fontSize: 12, color: "#6b7280" }}>{formatSize(doc.fileSize)}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        {doc.tags?.map((tag) => (
                                                            <span key={tag} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{tag}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: `${statusColor[doc.status]}18`,
                                                        color: statusColor[doc.status],
                                                        borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                                                        border: `1px solid ${statusColor[doc.status]}40`,
                                                    }}>
                                                        {doc.status}
                                                    </span>
                                                    {doc.adminNote && <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 2 }}>Note: {doc.adminNote}</div>}
                                                </td>
                                                <td style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    {doc.status === "approved" && (
                                                        <a
                                                            href={`${apiBase}${doc.fileUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-secondary"
                                                        >
                                                            Download
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
