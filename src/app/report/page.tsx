"use client";

import { useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import MapPicker from "@/components/MapPicker";
import { toast } from "react-toastify";

const TABS = [
    { label: "🦅  Field Survey", desc: "Report direct species observations" },
    { label: "🌿  Community Report", desc: "Document an ecological community" },
    { label: "📂  Bulk CSV Upload", desc: "Upload multiple records at once" },
];

export default function ReportPage() {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        speciesName: "", habitatType: "Forest", observationType: "Visual",
        numberOfIndividuals: "1", weatherCondition: "Clear", riskLevel: "Low",
        description: "", regionName: "", surveyName: "",
    });
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const submitFieldSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords) { toast.error("Please select a location on the map"); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            fd.append("lat", String(coords.lat));
            fd.append("lng", String(coords.lng));
            if (image) fd.append("image", image);
            await api.post("/reports", fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("Report submitted for review!");
            setForm({ speciesName: "", habitatType: "Forest", observationType: "Visual", numberOfIndividuals: "1", weatherCondition: "Clear", riskLevel: "Low", description: "", regionName: "", surveyName: "" });
            setCoords(null); setImage(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Submission failed");
        } finally {
            setLoading(false);
        }
    };

    const submitCsv = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile) { toast.error("Please select a CSV file"); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("csv", csvFile);
            const res = await api.post("/reports/bulk-csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success(res.data.message);
            setCsvFile(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">Submit Species Report</div>
                            <div className="topbar-subtitle">Document biodiversity observations in the field</div>
                        </div>
                    </div>

                    <div className="page-wrapper">
                        {/* Tab Switcher */}
                        <div className="tabs">
                            {TABS.map((t, i) => (
                                <button key={t.label} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Description */}
                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 22, marginTop: -14 }}>
                            {TABS[tab].desc}
                        </p>

                        {/* Field Survey & Community Report */}
                        {(tab === 0 || tab === 1) && (
                            <form onSubmit={submitFieldSurvey}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                                    {/* Left: Form Fields */}
                                    <div className="card">
                                        <div className="section-label" style={{ marginBottom: 20 }}>
                                            <span className="section-label-text">Observation Details</span>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Species Name *</label>
                                            <input className="form-input" required value={form.speciesName} onChange={set("speciesName")} placeholder="e.g. Bengal Tiger, Indian Peafowl" />
                                        </div>

                                        {tab === 0 && (
                                            <div className="form-group">
                                                <label className="form-label">Survey Name <span className="form-hint">(optional)</span></label>
                                                <input className="form-input" value={form.surveyName} onChange={set("surveyName")} placeholder="Optional survey identifier" />
                                            </div>
                                        )}

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label">Habitat Type</label>
                                                <select className="form-select" value={form.habitatType} onChange={set("habitatType")}>
                                                    {["Forest", "Grassland", "Wetland", "Desert", "Marine", "Freshwater", "Urban", "Agricultural", "Tundra", "Other"].map((h) => <option key={h}>{h}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Observation Type</label>
                                                <select className="form-select" value={form.observationType} onChange={set("observationType")}>
                                                    {["Visual", "Auditory", "Track/Sign", "Camera Trap", "Net/Trap", "Other"].map((o) => <option key={o}>{o}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label">No. of Individuals</label>
                                                <input className="form-input" type="number" min={0} value={form.numberOfIndividuals} onChange={set("numberOfIndividuals")} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Risk Level</label>
                                                <select className="form-select" value={form.riskLevel} onChange={set("riskLevel")}>
                                                    {["Low", "Medium", "High", "Critical"].map((r) => <option key={r}>{r}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label">Weather</label>
                                                <select className="form-select" value={form.weatherCondition} onChange={set("weatherCondition")}>
                                                    {["Clear", "Cloudy", "Rainy", "Windy", "Foggy", "Snowy", "Hot", "Cold"].map((w) => <option key={w}>{w}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Region Name</label>
                                                <input className="form-input" value={form.regionName} onChange={set("regionName")} placeholder="e.g. Sundarbans" />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <textarea className="form-textarea" value={form.description} onChange={set("description") as any} placeholder="Additional observations, behavior notes..." />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Photo <span className="form-hint">(optional, max 5MB)</span></label>
                                            <div className="file-input-wrap" style={{ position: "relative" }}>
                                                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                                                <div style={{ fontSize: 13, color: "#6b7280" }}>
                                                    {image ? image.name : "Click to choose a photo"}
                                                </div>
                                                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                                            </div>
                                        </div>

                                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !coords} style={{ marginTop: 4 }}>
                                            {loading ? <><span className="spinner" /> Submitting...</> : "Submit Report →"}
                                        </button>
                                        {!coords && (
                                            <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                                ⚠ Please select a location on the map to submit
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: Map */}
                                    <div className="card">
                                        <div className="section-label" style={{ marginBottom: 20 }}>
                                            <span className="section-label-text">Pin Location *</span>
                                        </div>
                                        <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14, marginTop: -10 }}>
                                            Click on the map to select the observation location
                                        </p>
                                        <MapPicker onLocationSelect={(lat, lng) => setCoords({ lat, lng })} />
                                        {coords && (
                                            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 12.5, color: "#15803d", border: "1px solid #bbf7d0" }}>
                                                ✅ Location selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Bulk CSV */}
                        {tab === 2 && (
                            <div style={{ maxWidth: 580 }}>
                                <div className="card">
                                    <div className="section-label" style={{ marginBottom: 20 }}>
                                        <span className="section-label-text">CSV Upload</span>
                                    </div>
                                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#92400e" }}>
                                        <strong>Required columns:</strong>{" "}
                                        <code style={{ fontSize: 11.5, background: "rgba(0,0,0,0.04)", padding: "2px 5px", borderRadius: 4 }}>
                                            speciesName, lat, lng, region, habitatType, observationType, numberOfIndividuals, riskLevel, description, surveyName
                                        </code>
                                    </div>
                                    <form onSubmit={submitCsv}>
                                        <div className="form-group">
                                            <label className="form-label">CSV File *</label>
                                            <div className="file-input-wrap" style={{ position: "relative" }}>
                                                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                                                    {csvFile ? csvFile.name : "Drop your CSV file here"}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#9ca3af" }}>or click to browse</div>
                                                <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                                            </div>
                                        </div>
                                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !csvFile}>
                                            {loading ? <><span className="spinner" /> Uploading...</> : "Upload CSV →"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
