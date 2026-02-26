"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import DataTable from "@/components/DataTable";
import { toast } from "react-toastify";
import { User, SpeciesReport } from "@/types";

const TABS = ["Reports", "Users", "Role Requests", "Species"];

export default function AdminPage() {
    const [tab, setTab] = useState(0);
    const [reports, setReports] = useState<SpeciesReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roleRequests, setRoleRequests] = useState<User[]>([]);
    const [species, setSpecies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [reportModal, setReportModal] = useState<{ open: boolean; id: string; status: string; note: string }>({ open: false, id: "", status: "approved", note: "" });
    const [speciesModal, setSpeciesModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 0) { const r = await api.get("/reports?limit=50"); setReports(r.data.reports); }
            if (tab === 1) { const r = await api.get("/admin/users"); setUsers(r.data.users); }
            if (tab === 2) { const r = await api.get("/admin/role-requests"); setRoleRequests(r.data); }
            if (tab === 3) { const r = await api.get("/species"); setSpecies(r.data.species); }
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [tab]);

    const updateReportStatus = async () => {
        try {
            await api.patch(`/reports/${reportModal.id}/status`, { status: reportModal.status, adminNote: reportModal.note });
            toast.success(`Report ${reportModal.status}`);
            setReportModal({ open: false, id: "", status: "approved", note: "" });
            loadData();
        } catch { toast.error("Failed to update status"); }
    };

    const updateUserRole = async (userId: string, role: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role });
            toast.success("Role updated");
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
                            <div><h1 className="page-title">Admin Panel</h1><p className="page-subtitle">Platform management and oversight</p></div>
                        </div>

                        <div className="tabs">
                            {TABS.map((t, i) => <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>)}
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
                                            key: "actions", label: "Promote", render: (u) => (
                                                u.role === "user" ? <button className="btn btn-sm btn-secondary" onClick={() => updateUserRole(u._id, "researcher")}>→ Researcher</button>
                                                    : u.role === "researcher" ? <button className="btn btn-sm btn-secondary" onClick={() => updateUserRole(u._id, "user")}>→ User</button>
                                                        : <span style={{ color: "#9ca3af", fontSize: 12 }}>Admin</span>
                                            )
                                        },
                                    ]}
                                />
                            </div>
                        )}

                        {/* Role Requests Tab */}
                        {tab === 2 && (
                            <div className="card">
                                <div className="card-header"><span className="card-title">Researcher Role Requests ({roleRequests.length})</span></div>
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
                                                        <button className="btn btn-sm btn-primary" onClick={() => updateUserRole(u._id, "researcher")}>Approve</button>
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
