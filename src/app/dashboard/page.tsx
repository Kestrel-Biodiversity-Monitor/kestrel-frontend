"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import ChartWidget from "@/components/ChartWidget";
import { SpeciesReport, Alert } from "@/types";

const STAT_CONFIG = [
    { key: "totalReports", label: "Total Reports", icon: "📋", gradient: "linear-gradient(135deg,#d1fae5,#a7f3d0)" },
    { key: "approvedReports", label: "Approved", icon: "✅", gradient: "linear-gradient(135deg,#dcfce7,#bbf7d0)" },
    { key: "pendingReports", label: "Pending Review", icon: "⏳", gradient: "linear-gradient(135deg,#fef9c3,#fde68a)" },
    { key: "totalSpecies", label: "Species Tracked", icon: "🦋", gradient: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
];

const RISK_COLORS: Record<string, string> = {
    Low: "badge-low", Medium: "badge-medium", High: "badge-high", Critical: "badge-critical",
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentReports, setRecentReports] = useState<SpeciesReport[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [speciesCount, setSpeciesCount] = useState<{ label: string; value: number }[]>([]);
    const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
    const [animalData, setAnimalData] = useState<any[]>([]);
    const [mapMode, setMapMode] = useState<"markers" | "heatmap">("markers");
    const [sortField, setSortField] = useState<"count" | "label">("count");
    const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const heatLayerRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const mapDataRef = useRef<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [comp, reports, alertsRes, sc, mt] = await Promise.all([
                    api.get("/analytics/comparison"),
                    api.get("/reports?limit=5"),
                    api.get("/alerts?status=active"),
                    api.get("/analytics/species-count"),
                    api.get("/analytics/monthly-trends"),
                ]);
                setStats(comp.data.totals);
                setRecentReports(reports.data.reports);
                setAlerts(alertsRes.data);
                setSpeciesCount(sc.data);
                setMonthlyTrends(mt.data);
                // Build animal-wise table data from species count
                setAnimalData(sc.data.slice(0, 20));
            } catch { /* silently fail on dashboard */ }
        };
        load();
    }, []);

    // Initialize map
    useEffect(() => {
        if (typeof window === "undefined" || !mapRef.current || leafletMapRef.current) return;
        const loadMap = async () => {
            const L = await import("leaflet");
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css"; link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
            const map = L.map(mapRef.current!).setView([20.5937, 78.9629], 4);
            L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
            }).addTo(map);
            leafletMapRef.current = map;

            try {
                const res = await api.get("/reports/map");
                mapDataRef.current = res.data;
                const markersGroup = L.layerGroup().addTo(map);
                markersLayerRef.current = markersGroup;

                res.data.forEach((r: any) => {
                    if (r.location?.coordinates?.length === 2) {
                        const [lng, lat] = r.location.coordinates;
                        const color = r.riskLevel === "Critical" ? "#dc2626" : r.riskLevel === "High" ? "#ea580c" : r.riskLevel === "Medium" ? "#d97706" : "#16a34a";
                        L.circleMarker([lat, lng], { radius: 7, color, fillColor: color, fillOpacity: 0.75, weight: 2 })
                            .bindPopup(`<b>${r.speciesName || "Species"}</b><br>Risk: ${r.riskLevel}<br>${r.userId?.name || ""}`)
                            .addTo(markersGroup);
                    }
                });
            } catch { /* no map data yet */ }
        };
        loadMap();
        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
                heatLayerRef.current = null;
                markersLayerRef.current = null;
            }
        };
    }, []);

    // Toggle heatmap / markers
    const switchMapMode = async (mode: "markers" | "heatmap") => {
        setMapMode(mode);
        const map = leafletMapRef.current;
        if (!map) return;

        if (mode === "heatmap") {
            // Hide markers
            if (markersLayerRef.current) map.removeLayer(markersLayerRef.current);

            if (!heatLayerRef.current) {
                // Dynamically load leaflet.heat
                if (!document.getElementById("leaflet-heat-js")) {
                    await new Promise<void>((resolve) => {
                        const script = document.createElement("script");
                        script.id = "leaflet-heat-js";
                        script.src = "https://unpkg.com/leaflet.heat/dist/leaflet-heat.js";
                        script.onload = () => resolve();
                        document.head.appendChild(script);
                    });
                }
                const heatPoints = mapDataRef.current
                    .filter((r: any) => r.location?.coordinates?.length === 2)
                    .map((r: any) => {
                        const [lng, lat] = r.location.coordinates;
                        const intensity = r.riskLevel === "Critical" ? 1 : r.riskLevel === "High" ? 0.75 : r.riskLevel === "Medium" ? 0.5 : 0.25;
                        return [lat, lng, intensity];
                    });
                const L = await import("leaflet");
                heatLayerRef.current = (L as any).heatLayer(heatPoints, {
                    radius: 28, blur: 20, maxZoom: 12,
                    gradient: { 0.25: "#16a34a", 0.5: "#d97706", 0.75: "#ea580c", 1.0: "#dc2626" },
                }).addTo(map);
            } else {
                map.addLayer(heatLayerRef.current);
            }
        } else {
            // Show markers, hide heat
            if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
            if (markersLayerRef.current) map.addLayer(markersLayerRef.current);
        }
    };

    // Sort animal data
    const sortedAnimal = [...animalData].sort((a, b) => {
        if (sortField === "count") return sortDir === "desc" ? b.value - a.value : a.value - b.value;
        return sortDir === "desc" ? b.label.localeCompare(a.label) : a.label.localeCompare(b.label);
    });

    const handleSort = (field: "count" | "label") => {
        if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortField(field); setSortDir("desc"); }
    };

    const maxCount = Math.max(...animalData.map(d => d.value), 1);

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    {/* Topbar */}
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">{getGreeting()}, {user?.name?.split(" ")[0]} 👋</div>
                            <div className="topbar-subtitle">Here's what's happening in your biodiversity network</div>
                        </div>
                        <span className={`badge badge-${user?.role}`} style={{ fontSize: 12, padding: "5px 12px" }}>{user?.role}</span>
                    </div>

                    <div className="page-wrapper">
                        {/* Stat Cards */}
                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            {STAT_CONFIG.map((s) => (
                                <div className="stat-card" key={s.label}>
                                    <div className="stat-icon" style={{ background: s.gradient }}>{s.icon}</div>
                                    <div>
                                        <div className="stat-value">{stats?.[s.key] ?? "–"}</div>
                                        <div className="stat-label">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div className="card">
                                <div className="card-header"><span className="card-title">Monthly Submissions</span></div>
                                <ChartWidget
                                    type="line"
                                    labels={monthlyTrends.map((m) => m.month)}
                                    datasets={[
                                        { label: "Total", data: monthlyTrends.map((m) => m.total), fill: true, backgroundColor: "rgba(26,71,49,0.07)", borderColor: "#1a4731" },
                                        { label: "Approved", data: monthlyTrends.map((m) => m.approved), borderColor: "#16a34a" },
                                    ]}
                                />
                            </div>
                            <div className="card">
                                <div className="card-header"><span className="card-title">Top Reported Species</span></div>
                                <ChartWidget
                                    type="bar"
                                    labels={speciesCount.slice(0, 8).map((s) => s.label)}
                                    datasets={[{ label: "Reports", data: speciesCount.slice(0, 8).map((s) => s.value) }]}
                                />
                            </div>
                        </div>

                        {/* Map + Alerts Row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 24 }}>
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Observation Map</span>
                                    {/* Heatmap Toggle */}
                                    <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                                        {(["markers", "heatmap"] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => switchMapMode(mode)}
                                                style={{
                                                    padding: "5px 14px",
                                                    fontSize: 12,
                                                    fontWeight: mapMode === mode ? 700 : 500,
                                                    background: mapMode === mode ? "#1a4731" : "#fff",
                                                    color: mapMode === mode ? "#fff" : "#6b7280",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s",
                                                    textTransform: "capitalize",
                                                }}
                                            >
                                                {mode === "markers" ? "📍 Markers" : "🔥 Heatmap"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div ref={mapRef} className="map-container" />
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Active Alerts</span>
                                    {alerts.length > 0 && (
                                        <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid #fecaca" }}>
                                            {alerts.length}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {alerts.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">🌿</div>
                                            <div className="empty-state-text">No active alerts</div>
                                        </div>
                                    ) : (
                                        alerts.map((a) => (
                                            <div key={a._id} className={`alert-banner ${a.severity.toLowerCase()}`}>
                                                <span>{a.severity === "Critical" ? "🔴" : a.severity === "Warning" ? "🟡" : "🔵"}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 12 }}>{a.region}</div>
                                                    <div style={{ fontSize: 12, marginTop: 2 }}>{a.message}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Animal-Wise Data Table */}
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="card-header">
                                <span className="card-title">🐾 Animal-Wise Observation Data</span>
                                <span style={{ fontSize: 12, color: "#6b7280" }}>From approved reports</span>
                            </div>
                            {animalData.length === 0 ? (
                                <div className="empty-state" style={{ padding: 40 }}>
                                    <div className="empty-state-icon">🦎</div>
                                    <div className="empty-state-text">No species data available yet</div>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th style={{ cursor: "pointer" }} onClick={() => handleSort("label")}>
                                                Species {sortField === "label" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                                            </th>
                                            <th style={{ cursor: "pointer" }} onClick={() => handleSort("count")}>
                                                Reports {sortField === "count" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                                            </th>
                                            <th style={{ minWidth: 180 }}>Distribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAnimal.map((animal, i) => {
                                            const pct = Math.round((animal.value / maxCount) * 100);
                                            return (
                                                <tr key={animal.label}>
                                                    <td style={{ color: "#9ca3af", fontSize: 12 }}>{i + 1}</td>
                                                    <td style={{ fontWeight: 600, color: "#111827" }}>{animal.label}</td>
                                                    <td>
                                                        <span style={{ fontWeight: 700, color: "#1a4731", fontSize: 14 }}>{animal.value}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                                                                <div style={{
                                                                    height: "100%",
                                                                    width: `${pct}%`,
                                                                    background: pct > 75 ? "#1a4731" : pct > 50 ? "#16a34a" : pct > 25 ? "#4ade80" : "#86efac",
                                                                    borderRadius: 999,
                                                                    transition: "width 0.4s ease",
                                                                }} />
                                                            </div>
                                                            <span style={{ fontSize: 11, color: "#6b7280", minWidth: 30 }}>{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Recent Reports */}
                        <div className="card" style={{ marginBottom: 28 }}>
                            <div className="card-header">
                                <span className="card-title">Recent Reports</span>
                                <a href="/report" className="btn btn-sm btn-secondary">View All</a>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Species</th><th>Location</th><th>Risk</th><th>Status</th><th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentReports.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px 0" }}>
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-text">No reports submitted yet</div>
                                        </td></tr>
                                    ) : (
                                        recentReports.map((r) => (
                                            <tr key={r._id}>
                                                <td style={{ fontWeight: 700, color: "#111827" }}>{r.speciesName || r.speciesId?.name || "—"}</td>
                                                <td style={{ color: "#6b7280", fontSize: 12 }}>{r.location?.regionName || `${r.location?.coordinates[1]?.toFixed(2)}, ${r.location?.coordinates[0]?.toFixed(2)}`}</td>
                                                <td><span className={`badge ${RISK_COLORS[r.riskLevel] || ""}`}>{r.riskLevel}</span></td>
                                                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                                                <td style={{ color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
