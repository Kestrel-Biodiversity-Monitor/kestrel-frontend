"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import ChartWidget from "@/components/ChartWidget";
import { SpeciesReport, Alert } from "@/types";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentReports, setRecentReports] = useState<SpeciesReport[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [speciesCount, setSpeciesCount] = useState<{ label: string; value: number }[]>([]);
    const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);

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
            } catch { /* silently fail on dashboard */ }
        };
        load();
    }, []);

    // Map setup
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

            // Load map markers
            try {
                const res = await api.get("/reports/map");
                res.data.forEach((r: any) => {
                    if (r.location?.coordinates?.length === 2) {
                        const [lng, lat] = r.location.coordinates;
                        const color = r.riskLevel === "Critical" ? "red" : r.riskLevel === "High" ? "orange" : "green";
                        L.circleMarker([lat, lng], { radius: 6, color, fillColor: color, fillOpacity: 0.7, weight: 1 })
                            .bindPopup(`<b>${r.speciesName || "Species"}</b><br>Risk: ${r.riskLevel}<br>${r.userId?.name || ""}`)
                            .addTo(map);
                    }
                });
            } catch { /* no map data yet */ }
        };
        loadMap();
        return () => { if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; } };
    }, []);

    const RISK_COLORS: Record<string, string> = {
        Low: "badge-low", Medium: "badge-medium", High: "badge-high", Critical: "badge-critical",
    };

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div style={{ padding: "28px 28px 0" }}>
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Dashboard</h1>
                                <p className="page-subtitle">Welcome back, <strong>{user?.name}</strong> · {user?.role}</p>
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            {[
                                { icon: "📋", label: "Total Reports", value: stats?.totalReports ?? "–", bg: "#e8f5ee" },
                                { icon: "✅", label: "Approved", value: stats?.approvedReports ?? "–", bg: "#dcfce7" },
                                { icon: "⏳", label: "Pending Review", value: stats?.pendingReports ?? "–", bg: "#fef9c3" },
                                { icon: "🐾", label: "Species Tracked", value: stats?.totalSpecies ?? "–", bg: "#ede9fe" },
                            ].map((s) => (
                                <div className="stat-card" key={s.label}>
                                    <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                                    <div>
                                        <div className="stat-value">{s.value}</div>
                                        <div className="stat-label">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                            {/* Monthly Trend */}
                            <div className="card">
                                <div className="card-header"><span className="card-title">Monthly Submissions</span></div>
                                <ChartWidget
                                    type="line"
                                    labels={monthlyTrends.map((m) => m.month)}
                                    datasets={[
                                        { label: "Total", data: monthlyTrends.map((m) => m.total), fill: true, backgroundColor: "rgba(26,71,49,0.08)", borderColor: "#1a4731" },
                                        { label: "Approved", data: monthlyTrends.map((m) => m.approved), borderColor: "#16a34a" },
                                    ]}
                                />
                            </div>

                            {/* Species Chart */}
                            <div className="card">
                                <div className="card-header"><span className="card-title">Top Reported Species</span></div>
                                <ChartWidget
                                    type="bar"
                                    labels={speciesCount.slice(0, 8).map((s) => s.label)}
                                    datasets={[{ label: "Reports", data: speciesCount.slice(0, 8).map((s) => s.value) }]}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 28 }}>
                            {/* Map */}
                            <div className="card">
                                <div className="card-header"><span className="card-title">Observation Map</span></div>
                                <div ref={mapRef} className="map-container" />
                            </div>

                            {/* Active Alerts */}
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Active Alerts</span>
                                    {alerts.length > 0 && <span className="badge badge-danger">{alerts.length}</span>}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {alerts.length === 0 ? (
                                        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No active alerts</p>
                                    ) : (
                                        alerts.map((a) => (
                                            <div key={a._id} className={`alert-banner ${a.severity.toLowerCase()}`}>
                                                <span>{a.severity === "Critical" ? "🔴" : a.severity === "Warning" ? "🟡" : "🔵"}</span>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 12 }}>{a.region}</div>
                                                    <div style={{ fontSize: 12, marginTop: 2 }}>{a.message}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
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
                                        <tr><td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0", fontSize: 13 }}>No reports submitted yet</td></tr>
                                    ) : (
                                        recentReports.map((r) => (
                                            <tr key={r._id}>
                                                <td style={{ fontWeight: 600, color: "#111827" }}>{r.speciesName || r.speciesId?.name || "—"}</td>
                                                <td style={{ color: "#6b7280" }}>{r.location?.regionName || `${r.location?.coordinates[1]?.toFixed(2)}, ${r.location?.coordinates[0]?.toFixed(2)}`}</td>
                                                <td><span className={`badge ${RISK_COLORS[r.riskLevel] || ""}`}>{r.riskLevel}</span></td>
                                                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                                                <td style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
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
