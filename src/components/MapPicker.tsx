"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat = 20.5937, initialLng = 78.9629 }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !mapRef.current || leafletMapRef.current) return;

        // Dynamic import to avoid SSR issues
        import("leaflet").then((L) => {
            // Fix default icons
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!).setView([initialLat, initialLng], 5);

            L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                attribution: "© OpenStreetMap © CARTO",
                maxZoom: 19,
            }).addTo(map);

            // Existing marker if initial coords given
            if (initialLat !== 20.5937 && initialLng !== 78.9629) {
                markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
                setCoords({ lat: initialLat, lng: initialLng });
            }

            map.on("click", (e: any) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) map.removeLayer(markerRef.current);
                markerRef.current = L.marker([lat, lng]).addTo(map)
                    .bindPopup(`<b>Selected:</b><br>${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
                setCoords({ lat, lng });
                onLocationSelect(lat, lng);
            });

            leafletMapRef.current = map;

            // Link Leaflet CSS
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css";
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
        });

        return () => {
            if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
        };
    }, []);

    return (
        <div>
            <div ref={mapRef} className="map-container" />
            {coords && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                    📍 Selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
            )}
            {!coords && (
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>Click on the map to select a location</p>
            )}
        </div>
    );
}
