"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import DataTable from "@/components/DataTable";
import { toast } from "react-toastify";
import { User, SpeciesReport, Document } from "@/types";

const TABS = ["Reports", "Users", "Role Requests", "Species", "Documents"];

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

const statusColor: Record<string, string> = {
    approved: "#16a34a", pending: "#ca8a04", rejected: "#dc2626",
};

export default function AdminPage() {
    const [tab, setTab] = useState(0);
    const [reports, setReports] = useState<SpeciesReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roleRequests, setRoleRequests] = useState<User[]>([]);
    const [species, setSpecies] = useState<any[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [docFilter, setDocFilter] = useState("pending");
    const [loading, setLoading] = useState(false);
    const [reportModal, setReportModal] = useState<{ open: boolean; id: string; status: string; note: string }>({ open: false, id: "", status: "approved", note: "" });
    const [speciesModal, setSpeciesModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
    const [docModal, setDocModal] = useState<{ open: boolean; id: string; status: string; note: string }>({ open: false, id: "", status: "approved", note: "" });

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 0) { const r = await api.get("/reports?limit=50"); setReports(r.data.reports); }
            if (tab === 1) { const r = await api.get("/admin/users"); setUsers(r.data.users); }
            if (tab === 2) { const r = await api.get("/admin/role-requests"); setRoleRequests(r.data); }
            if (tab === 3) { const r = await api.get("/species"); setSpecies(r.data.species); }
            if (tab === 4) {
                const params = docFilter ? `?status=${docFilter}` : "";
                const r = await api.get(`/documents${params}`);
                setDocuments(r.data.documents);
            }
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [tab, docFilter]);

    const updateReportStatus = async () => {
        try {
            await api.patch(`/reports/${reportModal.id}/status`, { status: reportModal.status, adminNote: reportModal.note });
            toast.success(`Report ${reportModal.status}`);
            setReportModal({ open: false, id: "", status: "approved", note: "" });
            loadData();
        } catch { toast.error("Failed to update status"); }
    };

    const updateDocumentStatus = async () => {
        try {
            await api.patch(`/documents/${docModal.id}/status`, { status: docModal.status, adminNote: docModal.note });
            toast.success(`Document ${docModal.status}`);
            setDocModal({ open: false, id: "", status: "approved", note: "" });
            loadData();
        } catch { toast.error("Failed to update document status"); }
    };

    const updateUserRole = async (userId: string, role: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role });
            toast.success("Role updated");
            loadData();
        } catch { toast.error("Failed"); }
    };

    const toggleUserActive = async (userId: string) => {
        try {
            await api.patch(`/admin/users/${userId}/toggle-active`);
            toast.success("User status updated");
            loadData();
        } catch { toast.error("Failed"); }
    };

    const saveSpecies = async () => {
        try {
            if (speciesModal.data._id) await api.put(`/species/${speciesModal.data._id}`, speciesModal.data);
            else await api.post("/species", speciesModal.data);
            toast.success("Species saved");
            setSpeciesModal({ open: false, data: null });
            loadData();
        } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const setSF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setSpeciesModal((m) => ({ ...m, data: { ...m.data, [k]: e.target.value } }));

    return (
        <ProtectedRoute requiredRole="admin">
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div style={{ padding: "28px" }}>
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Admin Panel</h1>
                                <p className="page-subtitle">Platform management and oversight</p>
                            </div>
                        </div>

                        <div className="tabs">
                            {TABS.map((t, i) => (
                                <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
                                    {t}
                                    {t === "Documents" && documents.filter(d => d.status === "pending").length > 0 && tab !== 4 && (
                                        <span style={{ marginLeft: 6, background: "#dc2626", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                                            {documents.filter(d => d.status === "pending").length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Reports Tab */}
                        {tab === 0 && (
                            <div className="card">
                                <div className="card-header"><span className="card-title">All Reports</span></div>
                                <DataTable loading={loading} data={reports}
                                    columns={[
                                        { key: "speciesName", label: "Species", render: (r) => r.speciesName || r.speciesId?.name || "—" },
                                        { key: "userId", label: "Submitted By", render: (r) => r.userId?.name || "—" },
                                        { key: "riskLevel", label: "Risk", render: (r) => <span className={`badge badge-${r.riskLevel.toLowerCase()}`}>{r.riskLevel}</span> },
                                        { key: "status", label: "Status", render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
                                        { key: "createdAt", label: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
                                        {
                                            key: "actions", label: "Actions", render: (r) => (
                                                <button className="btn btn-sm btn-secondary" onClick={() => setReportModal({ open: true, id: r._id, status: r.status, note: r.adminNote || "" })}>Review</button>
                                            )
                                        },
                                    ]}
                                />
                            </div>
                        )}

                        {/* Users Tab */}
                        {tab === 1 && (
                            <div className="card">
                                <div className="card-header"><span className="card-title">All Users</span></div>
                                <DataTable loading={loading} data={users}
                                    columns={[
                                        { key: "name", label: "Name" },
                                        { key: "email", label: "Email" },
                                        { key: "role", label: "Role", render: (u) => <span className={`badge badge-${u.role}`}>{u.role}</span> },
                                        { key: "contributionScore", label: "Score" },
                                        { key: "isActive", label: "Status", render: (u) => <span className={`badge ${u.isActive ? "badge-approved" : "badge-rejected"}`}>{u.isActive ? "Active" : "Inactive"}</span> },
                                        {
                                            key: "actions", label: "Role Actions", render: (u) => (
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    {u.role === "user" && <button className="btn btn-sm btn-secondary" onClick={() => updateUserRole(u._id, "officer")}>→ Officer</button>}
                                                    {u.role === "officer" && <button className="btn btn-sm btn-secondary" onClick={() => updateUserRole(u._id, "user")}>→ User</button>}
                                                    {u.role === "admin" && <span style={{ color: "#9ca3af", fontSize: 12 }}>Admin</span>}
                                                    <button className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-primary"}`} onClick={() => toggleUserActive(u._id)}>
                                                        {u.isActive ? "Deactivate" : "Activate"}
                                                    </button>
                                                </div>
                                            )
                                        },
                                    ]}
                                />
                            </div>
                        )}

                        {/* Role Requests Tab */}
                        {tab === 2 && (
                            <div className="card">
                                <div className="card-header"><span className="card-title">Role Upgrade Requests ({roleRequests.length})</span></div>
                                {roleRequests.length === 0 ? <p style={{ color: "#9ca3af", fontSize: 13, padding: "24px 0", textAlign: "center" }}>No pending requests</p> : (
                                    <DataTable loading={loading} data={roleRequests}
                                        columns={[
                                            { key: "name", label: "Name" },
                                            { key: "email", label: "Email" },
                                            { key: "organization", label: "Organization", render: (u) => u.organization || "—" },
                                            { key: "roleUpgradeReason", label: "Reason", render: (u) => <span style={{ fontSize: 12 }}>{u.roleUpgradeReason || "—"}</span> },
                                            {
                                                key: "actions", label: "Action", render: (u) => (
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button className="btn btn-sm btn-primary" onClick={() => updateUserRole(u._id, "officer")}>Approve → Officer</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => updateUserRole(u._id, "user")}>Reject</button>
                                                    </div>
                                                )
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                        )}

                        {/* Species Tab */}
                        {tab === 3 && (
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Species Master List</span>
                                    <button className="btn btn-primary btn-sm" onClick={() => setSpeciesModal({ open: true, data: { name: "", scientificName: "", category: "Mammal", conservationStatus: "Data Deficient", habitat: "" } })}>+ Add Species</button>
                                </div>
                                <DataTable loading={loading} data={species}
                                    columns={[
                                        { key: "name", label: "Common Name" },
                                        { key: "scientificName", label: "Scientific Name", render: (s) => <em style={{ color: "#6b7280" }}>{s.scientificName || "—"}</em> },
                                        { key: "category", label: "Category" },
                                        { key: "conservationStatus", label: "Conservation Status" },
                                        {
                                            key: "actions", label: "", render: (s) => (
                                                <button className="btn btn-sm btn-ghost" onClick={() => setSpeciesModal({ open: true, data: { ...s } })}>Edit</button>
                                            )
                                        },
                                    ]}
                                />
                            </div>
                        )}

                        {/* Documents Tab */}
                        {tab === 4 && (
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Document Approval</span>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <select className="form-select" value={docFilter} onChange={e => setDocFilter(e.target.value)} style={{ fontSize: 12, padding: "5px 8px" }}>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="">All</option>
                                        </select>
                                    </div>
                                </div>
                                {loading ? (
                                    <div style={{ padding: 40, textAlign: "center" }}>
                                        <div className="spinner" style={{ borderColor: "rgba(26,71,49,0.3)", borderTopColor: "#1a4731", width: 28, height: 28, margin: "0 auto" }} />
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="empty-state" style={{ padding: 60 }}>
                                        <div className="empty-state-icon">📂</div>
                                        <div className="empty-state-text">No {docFilter} documents</div>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Title</th>
                                                <th>Uploaded By</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.map(doc => (
                                                <tr key={doc._id}>
                                                    <td>
                                                        <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                                                            {doc.fileType.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.title}</div>
                                                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{doc.fileName}</div>
                                                    </td>
                                                    <td style={{ fontSize: 12 }}>
                                                        {doc.uploadedBy?.name}
                                                        <div style={{ color: "#9ca3af", fontSize: 11 }}>{doc.uploadedBy?.role}</div>
                                                    </td>
                                                    <td style={{ fontSize: 12, color: "#6b7280", maxWidth: 200 }}>
                                                        {doc.description ? doc.description.slice(0, 80) + (doc.description.length > 80 ? "…" : "") : "—"}
                                                    </td>
                                                    <td>
                                                        <span style={{ background: `${statusColor[doc.status]}18`, color: statusColor[doc.status], borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${statusColor[doc.status]}40` }}>
                                                            {doc.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <a href={`${apiBase}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">View</a>
                                                            {doc.status !== "approved" && (
                                                                <button className="btn btn-sm btn-primary" onClick={() => setDocModal({ open: true, id: doc._id, status: "approved", note: doc.adminNote || "" })}>Approve</button>
                                                            )}
                                                            {doc.status !== "rejected" && (
                                                                <button className="btn btn-sm btn-danger" onClick={() => setDocModal({ open: true, id: doc._id, status: "rejected", note: doc.adminNote || "" })}>Reject</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Review Modal */}
            <Modal isOpen={reportModal.open} onClose={() => setReportModal((m) => ({ ...m, open: false }))} title="Review Report"
                footer={<><button className="btn btn-secondary" onClick={() => setReportModal((m) => ({ ...m, open: false }))}>Cancel</button><button className="btn btn-primary" onClick={updateReportStatus}>Save Decision</button></>}>
                <div className="form-group">
                    <label className="form-label">Decision</label>
                    <select className="form-select" value={reportModal.status} onChange={(e) => setReportModal((m) => ({ ...m, status: e.target.value }))}>
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                        <option value="pending">Keep Pending</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Admin Note</label>
                    <textarea className="form-textarea" value={reportModal.note} onChange={(e) => setReportModal((m) => ({ ...m, note: e.target.value }))} placeholder="Optional note for the reporter..." style={{ minHeight: 80 }} />
                </div>
            </Modal>

            {/* Document Review Modal */}
            <Modal isOpen={docModal.open} onClose={() => setDocModal((m) => ({ ...m, open: false }))} title="Review Document"
                footer={<><button className="btn btn-secondary" onClick={() => setDocModal((m) => ({ ...m, open: false }))}>Cancel</button><button className="btn btn-primary" onClick={updateDocumentStatus}>Save Decision</button></>}>
                <div className="form-group">
                    <label className="form-label">Decision</label>
                    <select className="form-select" value={docModal.status} onChange={(e) => setDocModal((m) => ({ ...m, status: e.target.value }))}>
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                        <option value="pending">Keep Pending</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Admin Note</label>
                    <textarea className="form-textarea" value={docModal.note} onChange={(e) => setDocModal((m) => ({ ...m, note: e.target.value }))} placeholder="Reason for decision..." style={{ minHeight: 80 }} />
                </div>
            </Modal>

            {/* Species Modal */}
            <Modal isOpen={speciesModal.open} onClose={() => setSpeciesModal((m) => ({ ...m, open: false }))} title={speciesModal.data?._id ? "Edit Species" : "Add Species"}
                footer={<><button className="btn btn-secondary" onClick={() => setSpeciesModal((m) => ({ ...m, open: false }))}>Cancel</button><button className="btn btn-primary" onClick={saveSpecies}>Save</button></>}>
                {speciesModal.data && (
                    <>
                        <div className="grid-2">
                            <div className="form-group"><label className="form-label">Common Name</label><input className="form-input" value={speciesModal.data.name || ""} onChange={setSF("name")} /></div>
                            <div className="form-group"><label className="form-label">Scientific Name</label><input className="form-input" value={speciesModal.data.scientificName || ""} onChange={setSF("scientificName")} /></div>
                        </div>
                        <div className="grid-2">
                            <div className="form-group"><label className="form-label">Category</label>
                                <select className="form-select" value={speciesModal.data.category} onChange={setSF("category")}>
                                    {["Mammal", "Bird", "Reptile", "Amphibian", "Fish", "Invertebrate", "Plant", "Fungi", "Other"].map((c) => <option key={c}>{c}</option>)}
                                </select></div>
                            <div className="form-group"><label className="form-label">Conservation Status</label>
                                <select className="form-select" value={speciesModal.data.conservationStatus} onChange={setSF("conservationStatus")}>
                                    {["Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered", "Extinct in Wild", "Extinct", "Data Deficient"].map((s) => <option key={s}>{s}</option>)}
                                </select></div>
                        </div>
                        <div className="form-group"><label className="form-label">Habitat</label><input className="form-input" value={speciesModal.data.habitat || ""} onChange={setSF("habitat")} /></div>
                    </>
                )}
            </Modal>
        </ProtectedRoute>
    );
}
