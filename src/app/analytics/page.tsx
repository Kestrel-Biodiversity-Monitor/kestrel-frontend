"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import ChartWidget from "@/components/ChartWidget";

export default function AnalyticsPage() {
    const [comparison, setComparison] = useState<any>(null);
    const [speciesCount, setSpeciesCount] = useState<{ label: string; value: number }[]>([]);
    const [monthly, setMonthly] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [animalSort, setAnimalSort] = useState<{ field: "label" | "value"; dir: "asc" | "desc" }>({ field: "value", dir: "desc" });

    useEffect(() => {
        const load = async () => {
            try {
                const [c, sc, m, r] = await Promise.all([
                    api.get("/analytics/comparison"),
                    api.get("/analytics/species-count"),
                    api.get("/analytics/monthly-trends"),
                    api.get("/analytics/region-summary"),
                ]);
                setComparison(c.data);
                setSpeciesCount(sc.data);
                setMonthly(m.data);
                setRegions(r.data);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const STAT_CONFIG = [
        { key: "totalReports", label: "Total Reports", icon: "📋", gradient: "linear-gradient(135deg,#d1fae5,#a7f3d0)" },
        { key: "approvedReports", label: "Approved", icon: "✅", gradient: "linear-gradient(135deg,#dcfce7,#bbf7d0)" },
        { key: "pendingReports", label: "Pending", icon: "⏳", gradient: "linear-gradient(135deg,#fef9c3,#fde68a)" },
        { key: "totalSpecies", label: "Species", icon: "🦋", gradient: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
    ];

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">Analytics</div>
                            <div className="topbar-subtitle">Ecological data insights and biodiversity trends</div>
                        </div>
                    </div>

                    <div className="page-wrapper">
                        {/* Overview Stats */}
                        {comparison?.totals && (
                            <div className="grid-4" style={{ marginBottom: 24 }}>
                                {STAT_CONFIG.map((s) => (
                                    <div className="stat-card" key={s.label}>
                                        <div className="stat-icon" style={{ background: s.gradient }}>{s.icon}</div>
                                        <div>
                                            <div className="stat-value">{comparison.totals[s.key]}</div>
                                            <div className="stat-label">{s.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Species Distribution */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="card-header"><span className="card-title">Species Distribution (Top 15 Reported)</span></div>
                            {loading ? (
                                <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                                    <div className="spinner-dark" style={{ margin: "0 auto 12px" }} />
                                    Loading chart data...
                                </div>
                            ) : (
                                <ChartWidget type="bar" height={320}
                                    labels={speciesCount.map((s) => s.label)}
                                    datasets={[{ label: "Reports", data: speciesCount.map((s) => s.value) }]}
                                />
                            )}
                        </div>

                        {/* Trends + Conservation */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div className="card">
                                <div className="card-header"><span className="card-title">Monthly Submission Trends</span></div>
                                <ChartWidget type="line" height={260}
                                    labels={monthly.map((m) => m.month)}
                                    datasets={[
                                        { label: "Approved", data: monthly.map((m) => m.approved), borderColor: "#16a34a", fill: false },
                                        { label: "Pending", data: monthly.map((m) => m.pending), borderColor: "#d97706", fill: false },
                                        { label: "Total", data: monthly.map((m) => m.total), borderColor: "#1a4731", fill: true, backgroundColor: "rgba(26,71,49,0.06)" },
                                    ]}
                                />
                            </div>
                            <div className="card">
                                <div className="card-header"><span className="card-title">Conservation Status Breakdown</span></div>
                                {comparison?.conservationBreakdown?.length > 0 ? (
                                    <ChartWidget type="doughnut" height={260}
                                        labels={comparison.conservationBreakdown.map((d: any) => d.label)}
                                        datasets={[{ label: "Species", data: comparison.conservationBreakdown.map((d: any) => d.value) }]}
                                    />
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🌿</div>
                                        <div className="empty-state-text">No species data yet</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Region Summary */}
                        <div className="card">
                            <div className="card-header"><span className="card-title">Region Summary</span></div>
                            {regions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🗺️</div>
                                    <div className="empty-state-text">No regional data available</div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
                                    {regions.map((r) => (
                                        <div key={r.region} style={{
                                            background: "#f8faf9",
                                            border: "1px solid #e2e8e4",
                                            borderRadius: 10,
                                            padding: "14px 16px",
                                            transition: "box-shadow 0.18s, transform 0.18s",
                                            cursor: "default",
                                        }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                                        >
                                            <div style={{ fontWeight: 700, color: "#111827", marginBottom: 8, fontSize: 14, fontFamily: "Plus Jakarta Sans, sans-serif" }}>{r.region}</div>
                                            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6b7280", flexWrap: "wrap" }}>
                                                <span>📋 {r.reportCount} reports</span>
                                                <span>👥 ~{r.avgIndividuals} avg</span>
                                                {r.highRisk > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>⚠ {r.highRisk} high risk</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Animal-Wise Data Table */}
                        <div className="card" style={{ marginTop: 20 }}>
                            <div className="card-header">
                                <span className="card-title">🐾 Animal-Wise Observation Data</span>
                                <span style={{ fontSize: 12, color: "#6b7280" }}>Sorted by report count — approved sightings</span>
                            </div>
                            {speciesCount.length === 0 ? (
                                <div className="empty-state" style={{ padding: 40 }}>
                                    <div className="empty-state-icon">🦎</div>
                                    <div className="empty-state-text">No species observation data yet</div>
                                </div>
                            ) : (() => {
                                const sorted = [...speciesCount].sort((a, b) => {
                                    const field = animalSort.field;
                                    const dir = animalSort.dir === "desc" ? -1 : 1;
                                    if (field === "value") return (b.value - a.value) * dir * -1;
                                    return a.label.localeCompare(b.label) * dir;
                                });
                                const maxVal = Math.max(...speciesCount.map(s => s.value), 1);
                                const handleSort = (field: "label" | "value") => {
                                    setAnimalSort(s => s.field === field ? { field, dir: s.dir === "desc" ? "asc" : "desc" } : { field, dir: "desc" });
                                };
                                return (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40 }}>#</th>
                                                <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("label")}>
                                                    Species Name {animalSort.field === "label" ? (animalSort.dir === "desc" ? "↓" : "↑") : <span style={{ color: "#d1d5db" }}>↕</span>}
                                                </th>
                                                <th style={{ cursor: "pointer", userSelect: "none", width: 120 }} onClick={() => handleSort("value")}>
                                                    Sightings {animalSort.field === "value" ? (animalSort.dir === "desc" ? "↓" : "↑") : <span style={{ color: "#d1d5db" }}>↕</span>}
                                                </th>
                                                <th style={{ minWidth: 200 }}>Report Share</th>
                                                <th style={{ width: 100 }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.map((s, idx) => {
                                                const pct = Math.round((s.value / maxVal) * 100);
                                                const isTop = idx < 3;
                                                const barColor = pct > 75 ? "#1a4731" : pct > 50 ? "#16a34a" : pct > 25 ? "#4ade80" : "#86efac";
                                                const status = pct > 75 ? { label: "High Activity", color: "#16a34a" } : pct > 40 ? { label: "Moderate", color: "#d97706" } : { label: "Low Activity", color: "#9ca3af" };
                                                return (
                                                    <tr key={s.label} style={{ background: isTop ? "rgba(26,71,49,0.02)" : undefined }}>
                                                        <td>
                                                            <span style={{ fontWeight: 700, color: isTop ? "#1a4731" : "#9ca3af", fontSize: isTop ? 14 : 12 }}>
                                                                {isTop ? ["🥇", "🥈", "🥉"][idx] : idx + 1}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: "#111827" }}>{s.label}</td>
                                                        <td>
                                                            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a4731" }}>{s.value}</span>
                                                            <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>reports</span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                                                                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 999, transition: "width 0.5s ease" }} />
                                                                </div>
                                                                <span style={{ fontSize: 11, color: "#6b7280", minWidth: 32 }}>{pct}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ background: `${status.color}18`, color: status.color, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 600, border: `1px solid ${status.color}30` }}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                );
                            })()}
                        </div>

                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
