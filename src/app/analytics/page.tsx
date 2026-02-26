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

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div style={{ padding: "28px" }}>
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Analytics</h1>
                                <p className="page-subtitle">Ecological data insights and biodiversity trends</p>
                            </div>
                        </div>

                        {/* Overview stats */}
                        {comparison?.totals && (
                            <div className="grid-4" style={{ marginBottom: 24 }}>
                                {[
                                    { label: "Total Reports", value: comparison.totals.totalReports, icon: "📋", bg: "#e8f5ee" },
                                    { label: "Approved", value: comparison.totals.approvedReports, icon: "✅", bg: "#dcfce7" },
                                    { label: "Pending", value: comparison.totals.pendingReports, icon: "⏳", bg: "#fef9c3" },
                                    { label: "Species", value: comparison.totals.totalSpecies, icon: "🐾", bg: "#ede9fe" },
                                ].map((s) => (
                                    <div className="stat-card" key={s.label}>
                                        <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                                        <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Species Distribution */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="card-header"><span className="card-title">Species Distribution (Top 15 Reported)</span></div>
                            {loading ? <p style={{ color: "#9ca3af", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading chart...</p> : (
                                <ChartWidget type="bar" height={320}
                                    labels={speciesCount.map((s) => s.label)}
                                    datasets={[{ label: "Reports", data: speciesCount.map((s) => s.value) }]}
                                />
                            )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            {/* Monthly Trends */}
                            <div className="card">
                                <div className="card-header"><span className="card-title">Monthly Submission Trends</span></div>
                                <ChartWidget type="line" height={260}
                                    labels={monthly.map((m) => m.month)}
                                    datasets={[
                                        { label: "Approved", data: monthly.map((m) => m.approved), borderColor: "#16a34a", fill: false },
                                        { label: "Pending", data: monthly.map((m) => m.pending), borderColor: "#b45309", fill: false },
                                        { label: "Total", data: monthly.map((m) => m.total), borderColor: "#1a4731", fill: true, backgroundColor: "rgba(26,71,49,0.06)" },
                                    ]}
                                />
                            </div>

                            {/* Conservation Status */}
                            <div className="card">
                                <div className="card-header"><span className="card-title">Conservation Status Breakdown</span></div>
                                {comparison?.conservationBreakdown?.length > 0 ? (
                                    <ChartWidget type="doughnut" height={260}
                                        labels={comparison.conservationBreakdown.map((d: any) => d.label)}
                                        datasets={[{ label: "Species", data: comparison.conservationBreakdown.map((d: any) => d.value) }]}
                                    />
                                ) : <p style={{ color: "#9ca3af", fontSize: 13, padding: "40px 0", textAlign: "center" }}>No species data yet</p>}
                            </div>
                        </div>

                        {/* Region Summary */}
                        <div className="card">
                            <div className="card-header"><span className="card-title">Region Summary</span></div>
                            {regions.length === 0 ? (
                                <p style={{ color: "#9ca3af", fontSize: 13, padding: "24px 0", textAlign: "center" }}>No regional data available</p>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                                    {regions.map((r) => (
                                        <div key={r.region} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
                                            <div style={{ fontWeight: 700, color: "#111827", marginBottom: 6, fontSize: 14 }}>{r.region}</div>
                                            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                                                <span>📋 {r.reportCount} reports</span>
                                                <span>👥 ~{r.avgIndividuals} avg</span>
                                                {r.highRisk > 0 && <span style={{ color: "#991b1b" }}>⚠ {r.highRisk} high risk</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
