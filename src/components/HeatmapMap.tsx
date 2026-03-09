"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface HeatmapMapProps {
  points: [number, number, number][]; // [lat, lng, intensity]
  onZoomChange?: (zoom: number) => void;
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

// ZoomListener component
function ZoomListener({ onZoomChange }: { onZoomChange?: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !onZoomChange) return;

    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      onZoomChange(currentZoom);
    };

    map.on("zoomend", handleZoomEnd);

    // Initial zoom
    onZoomChange(map.getZoom());

    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null;
}

export default function HeatmapMap({ points, onZoomChange }: HeatmapMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.length > 0 && <HeatLayer points={points} />}
      <ZoomListener onZoomChange={onZoomChange} />
    </MapContainer>
  );
}
