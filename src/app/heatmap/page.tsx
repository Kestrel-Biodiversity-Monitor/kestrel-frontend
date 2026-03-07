"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { toast } from "react-toastify";

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const useMap = dynamic(() => import("react-leaflet").then((mod) => mod.useMap), { ssr: false });

interface HeatmapData {
    count: number;
    data: [number, number, number][]; // [lat, lng, intensity]
}

// HeatLayer component
function HeatLayer({ points }: { points: [number, number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        // Dynamically import leaflet.heat
        import("leaflet.heat").then((L) => {
            // Remove existing heat layer
            map.eachLayer((layer: any) => {
                if (layer._heat) map.removeLayer(layer);
            });

            // Add new heat layer
            const heat = (L as any).heatLayer(points, {
                radius: 25,
                blur: 15,
                maxZoom: 10,
                max: 1.0,
                gradient: {
                    0.0: "#0000ff",
                    0.3: "#00ff00",
                    0.6: "#ffff00",
                    1.0: "#ff0000",
                },
            });
            heat.addTo(map);
        });
    }, [map, points]);

    return null;
}

const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];

export default function HeatmapPage() {
    const [heatmapData, setHeatmapData] = useState<HeatmapData>({ count: 0, data: [] });
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [species, setSpecies] = useState("");
    const [riskLevel, setRiskLevel] = useState("");
    const [center] = useState<[number, number]>([20, 0]); // Default world center
    const [zoom] = useState(2);

    const loadHeatmap = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (species) params.species = species;
            if (riskLevel) params.riskLevel = riskLevel;

            const res = await api.get("/analytics/heatmap", { params });
            setHeatmapData(res.data);
            toast.success(`Loaded ${res.data.count} data points`);
        } catch {
            toast.error("Failed to load heatmap data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHeatmap();
    }, []);

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setSpecies("");
        setRiskLevel("");
    };

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">🗺️ Species Heatmap</div>
                            <div className="topbar-subtitle">Interactive geographical distribution visualization</div>
                        </div>
                    </div>

                    <div className="page-wrapper" style={{ padding: 0, height: "calc(100vh - 70px)" }}>
                        {/* Filter Panel */}
                        <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1000, background: "white", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", maxWidth: 300 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Filters</div>
                            
                            <div className="form-group" style={{ marginBottom: 10 }}>
                                <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Start Date</label>
                                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
                            </div>

                            <div className="form-group" style={{ marginBottom: 10 }}>
                                <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>End Date</label>
                                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
                            </div>

                            <div className="form-group" style={{ marginBottom: 10 }}>
                                <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Species</label>
                                <input type="text" placeholder="Search species..." className="form-input" value={species} onChange={(e) => setSpecies(e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
                            </div>

                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Risk Level</label>
                                <select className="form-input" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }}>
                                    <option value="">All Levels</option>
                                    {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={loadHeatmap} disabled={loading} className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}>
                                    {loading ? "Loading..." : "Apply"}
                                </button>
                                <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ fontSize: 12, padding: "6px 10px" }}>
                                    Reset
                                </button>
                            </div>

                            <div style={{ marginTop: 12, padding: 8, background: "#f3f4f6", borderRadius: 4, fontSize: 11, color: "#6b7280", textAlign: "center" }}>
                                {heatmapData.count} data points
                            </div>
                        </div>

                        {/* Map Container */}
                        <div style={{ width: "100%", height: "100%" }}>
                            {typeof window !== "undefined" && (
                                <MapContainer
                                    center={center}
                                    zoom={zoom}
                                    scrollWheelZoom={true}
                                    style={{ width: "100%", height: "100%" }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {heatmapData.data.length > 0 && <HeatLayer points={heatmapData.data} />}
                                </MapContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
