"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { Document, SpeciesReport } from "@/types";
import { toast } from "react-toastify";

const TABS = ["Upload Document", "Upload CSV", "My Submissions"];

function formatSize(bytes?: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusColor: Record<string, string> = {
    approved: "#16a34a", pending: "#ca8a04", rejected: "#dc2626",
};

export default function OfficerPage() {
    const [tab, setTab] = useState(0);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [reports, setReports] = useState<SpeciesReport[]>([]);
    const [loading, setLoading] = useState(false);

    // Doc upload form
    const [docForm, setDocForm] = useState({ title: "", description: "", tags: "" });
    const [docUploading, setDocUploading] = useState(false);
    const docFileRef = useRef<HTMLInputElement>(null);

    // CSV upload form
    const [csvSurvey, setCsvSurvey] = useState("");
    const [csvUploading, setCsvUploading] = useState(false);
    const csvFileRef = useRef<HTMLInputElement>(null);

    const loadMyData = async () => {
        setLoading(true);
        try {
            const [docsRes, reportsRes] = await Promise.all([
                api.get("/documents"),
                api.get("/reports"),
            ]);
            setDocuments(docsRes.data.documents);
            setReports(reportsRes.data.reports);
        } catch {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (tab === 2) loadMyData(); }, [tab]);

    const handleDocUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFileRef.current?.files?.[0]) return toast.error("Please select a file");
        if (!docForm.title.trim()) return toast.error("Title is required");
        setDocUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", docFileRef.current.files[0]);
            fd.append("title", docForm.title);
            fd.append("description", docForm.description);
            fd.append("tags", docForm.tags);
            await api.post("/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("Document uploaded — awaiting admin approval");
            setDocForm({ title: "", description: "", tags: "" });
            if (docFileRef.current) docFileRef.current.value = "";
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setDocUploading(false);
        }
    };

    const handleCsvUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFileRef.current?.files?.[0]) return toast.error("Please select a CSV file");
        setCsvUploading(true);
        try {
            const fd = new FormData();
            fd.append("csv", csvFileRef.current.files[0]);
            if (csvSurvey) fd.append("surveyName", csvSurvey);
            const res = await api.post("/reports/bulk-csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success(`${res.data.inserted} records uploaded from CSV`);
            setCsvSurvey("");
            if (csvFileRef.current) csvFileRef.current.value = "";
        } catch (err: any) {
            toast.error(err.response?.data?.message || "CSV upload failed");
        } finally {
            setCsvUploading(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="officer">
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">🛡️ Officer Panel</div>
                            <div className="topbar-subtitle">Upload documents, CSV data, and track your submissions</div>
                        </div>
                    </div>

                    <div className="page-wrapper">
                        {/* Stats Row */}
                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            {[
                                { label: "My Documents", value: documents.length, icon: "📄", color: "linear-gradient(135deg,#dbeafe,#bfdbfe)" },
                                { label: "Pending Review", value: documents.filter(d => d.status === "pending").length, icon: "⏳", color: "linear-gradient(135deg,#fef9c3,#fde68a)" },
                                { label: "Approved Docs", value: documents.filter(d => d.status === "approved").length, icon: "✅", color: "linear-gradient(135deg,#dcfce7,#bbf7d0)" },
                                { label: "My Reports", value: reports.length, icon: "📋", color: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
                            ].map(s => (
                                <div className="stat-card" key={s.label}>
                                    <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                                    <div>
                                        <div className="stat-value">{loading ? "—" : s.value}</div>
                                        <div className="stat-label">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="tabs" style={{ marginBottom: 20 }}>
                            {TABS.map((t, i) => (
                                <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => { setTab(i); if (i === 2) loadMyData(); }}>
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Upload Document Tab */}
                        {tab === 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Upload Document</span>
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>Supported: PDF, CSV, PNG, JPG, DOC, TXT</span>
                                </div>
                                <form onSubmit={handleDocUpload}>
                                    <div className="grid-2" style={{ marginBottom: 12 }}>
                                        <div className="form-group">
                                            <label className="form-label">Title *</label>
                                            <input className="form-input" value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Tiger Survey Report Q1 2024" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Tags (comma separated)</label>
                                            <input className="form-input" value={docForm.tags} onChange={e => setDocForm(f => ({ ...f, tags: e.target.value }))} placeholder="tiger, survey, forest" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-textarea" value={docForm.description} onChange={e => setDocForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this document contains..." style={{ minHeight: 80 }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Select File *</label>
                                        <input ref={docFileRef} type="file" className="form-input" accept=".pdf,.csv,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt" />
                                    </div>
                                    <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 16 }}>
                                        ⚠️ Documents require <strong>admin approval</strong> before they become publicly visible.
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={docUploading}>
                                        {docUploading ? "Uploading..." : "📤 Upload Document"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Upload CSV Tab */}
                        {tab === 1 && (
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Bulk CSV Upload</span>
                                </div>
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: "#14532d", marginBottom: 6 }}>📋 Required CSV Columns:</div>
                                    <code style={{ fontSize: 12, color: "#166534", fontFamily: "monospace" }}>
                                        speciesName, lng, lat, region, habitatType, observationType, numberOfIndividuals, riskLevel, description, surveyName
                                    </code>
                                </div>
                                <form onSubmit={handleCsvUpload}>
                                    <div className="form-group">
                                        <label className="form-label">Survey Name (optional)</label>
                                        <input className="form-input" value={csvSurvey} onChange={e => setCsvSurvey(e.target.value)} placeholder="e.g. Western Ghats Survey 2024" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">CSV File *</label>
                                        <input ref={csvFileRef} type="file" className="form-input" accept=".csv,text/csv" />
                                    </div>
                                    <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 16 }}>
                                        ⚠️ Each CSV row will create a <strong>pending species report</strong> requiring admin approval.
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={csvUploading}>
                                        {csvUploading ? "Processing..." : "📊 Upload CSV"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* My Submissions Tab */}
                        {tab === 2 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                {/* My Documents */}
                                <div className="card">
                                    <div className="card-header"><span className="card-title">My Documents ({documents.length})</span></div>
                                    {loading ? (
                                        <div style={{ padding: 40, textAlign: "center" }}>
                                            <div className="spinner" style={{ borderColor: "rgba(26,71,49,0.3)", borderTopColor: "#1a4731", width: 28, height: 28, margin: "0 auto" }} />
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <div className="empty-state" style={{ padding: 40 }}>
                                            <div className="empty-state-icon">📂</div>
                                            <div className="empty-state-text">No documents uploaded yet</div>
                                        </div>
                                    ) : (
                                        <table className="data-table">
                                            <thead><tr><th>Title</th><th>Type</th><th>Size</th><th>Status</th><th>Admin Note</th><th>Uploaded</th></tr></thead>
                                            <tbody>
                                                {documents.map(doc => (
                                                    <tr key={doc._id}>
                                                        <td style={{ fontWeight: 600, fontSize: 13 }}>{doc.title}</td>
                                                        <td><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{doc.fileType.toUpperCase()}</span></td>
                                                        <td style={{ fontSize: 12, color: "#6b7280" }}>{formatSize(doc.fileSize)}</td>
                                                        <td>
                                                            <span style={{ background: `${statusColor[doc.status]}18`, color: statusColor[doc.status], borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${statusColor[doc.status]}40` }}>
                                                                {doc.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: 11, color: "#6b7280" }}>{doc.adminNote || "—"}</td>
                                                        <td style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* My Reports */}
                                <div className="card">
                                    <div className="card-header"><span className="card-title">My Species Reports ({reports.length})</span></div>
                                    {loading ? (
                                        <div style={{ padding: 40, textAlign: "center" }}>
                                            <div className="spinner" style={{ borderColor: "rgba(26,71,49,0.3)", borderTopColor: "#1a4731", width: 28, height: 28, margin: "0 auto" }} />
                                        </div>
                                    ) : reports.length === 0 ? (
                                        <div className="empty-state" style={{ padding: 40 }}>
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-text">No reports submitted yet</div>
                                        </div>
                                    ) : (
                                        <table className="data-table">
                                            <thead><tr><th>Species</th><th>Location</th><th>Habitat</th><th>Risk</th><th>Status</th><th>Date</th></tr></thead>
                                            <tbody>
                                                {reports.map(r => (
                                                    <tr key={r._id}>
                                                        <td style={{ fontWeight: 600, fontSize: 13 }}>{r.speciesName || r.speciesId?.name || "—"}</td>
                                                        <td style={{ fontSize: 12, color: "#6b7280" }}>{r.location?.regionName || `${r.location?.coordinates[1]?.toFixed(2)}, ${r.location?.coordinates[0]?.toFixed(2)}`}</td>
                                                        <td style={{ fontSize: 12 }}>{r.habitatType}</td>
                                                        <td><span className={`badge badge-${r.riskLevel.toLowerCase()}`}>{r.riskLevel}</span></td>
                                                        <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                                                        <td style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
