"use client";

import { useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import MapPicker from "@/components/MapPicker";
import { toast } from "react-toastify";

const TABS = ["Field Survey", "Community Report", "Bulk CSV"];

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
                    <div style={{ padding: "28px" }}>
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Submit Species Report</h1>
                                <p className="page-subtitle">Document biodiversity observations in the field</p>
                            </div>
                        </div>

                        <div className="tabs">
                            {TABS.map((t, i) => (
                                <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>
                            ))}
                        </div>

                        {(tab === 0 || tab === 1) && (
                            <form onSubmit={submitFieldSurvey}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">Species Name *</label>
                                            <input className="form-input" required value={form.speciesName} onChange={set("speciesName")} placeholder="e.g. Bengal Tiger, Indian Peafowl" />
                                        </div>
                                        {tab === 0 && (
                                            <div className="form-group">
                                                <label className="form-label">Survey Name</label>
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
                                            <label className="form-label">Photo <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional, max 5MB)</span></label>
                                            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)}
                                                style={{ fontSize: 13, color: "#374151" }} />
                                        </div>
                                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !coords}>
                                            {loading ? <><span className="spinner" /> Submitting...</> : "Submit Report"}
                                        </button>
                                    </div>

                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">Location * <span style={{ color: "#9ca3af", fontWeight: 400 }}>Click map to select</span></label>
                                            <MapPicker onLocationSelect={(lat, lng) => setCoords({ lat, lng })} />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {tab === 2 && (
                            <div className="card" style={{ maxWidth: 540 }}>
                                <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>Bulk CSV Upload</h3>
                                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                                    Upload a CSV file with columns: <code>speciesName, lat, lng, region, habitatType, observationType, numberOfIndividuals, riskLevel, description, surveyName</code>
                                </p>
                                <form onSubmit={submitCsv}>
                                    <div className="form-group">
                                        <label className="form-label">CSV File *</label>
                                        <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                            style={{ fontSize: 13, color: "#374151" }} />
                                    </div>
                                    <button className="btn btn-primary" type="submit" disabled={loading || !csvFile}>
                                        {loading ? <><span className="spinner" /> Uploading...</> : "Upload CSV"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
