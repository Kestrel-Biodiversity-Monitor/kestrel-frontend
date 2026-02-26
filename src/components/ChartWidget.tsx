"use client";

import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    LineElement, PointElement,
    ArcElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    LineElement, PointElement, ArcElement,
    Title, Tooltip, Legend, Filler
);

interface Props {
    type: "bar" | "line" | "doughnut";
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: boolean;
        tension?: number;
    }[];
    title?: string;
    height?: number;
}

const PALETTE = [
    "#1a4731", "#225e40", "#2d7a55", "#5cb887",
    "#0f1e2d", "#1c3448", "#264d6a", "#3a7ca5",
    "#4b5563", "#6b7280", "#9ca3af",
    "#b45309", "#92400e", "#d97706",
];

export default function ChartWidget({ type, labels, datasets, title, height = 280 }: Props) {
    const enriched = datasets.map((ds, i) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || PALETTE[i % PALETTE.length],
        borderColor: ds.borderColor || PALETTE[i % PALETTE.length],
        borderWidth: ds.borderWidth ?? 1.5,
        tension: ds.tension ?? 0.4,
    }));

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "bottom" as const, labels: { boxWidth: 12, font: { size: 12 }, color: "#4b5563" } },
            title: title ? { display: true, text: title, font: { size: 13, weight: "600" } } : { display: false },
            tooltip: { bodyFont: { size: 12 }, titleFont: { size: 12 } },
        },
        scales: type !== "doughnut" ? {
            x: { grid: { display: false }, ticks: { color: "#6b7280", font: { size: 11 } } },
            y: { grid: { color: "#f3f4f6" }, ticks: { color: "#6b7280", font: { size: 11 } } },
        } : undefined,
    };

    const data = { labels, datasets: enriched };

    return (
        <div style={{ height, position: "relative" }}>
            {type === "bar" && <Bar data={data} options={options} />}
            {type === "line" && <Line data={data} options={options} />}
            {type === "doughnut" && <Doughnut data={data} options={options} />}
        </div>
    );
}
