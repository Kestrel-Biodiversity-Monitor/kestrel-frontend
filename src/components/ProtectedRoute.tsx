"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface Props {
    children: ReactNode;
    requiredRole?: "admin" | "officer" | "researcher";
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) router.push("/login");
        if (!isLoading && user && requiredRole && user.role !== requiredRole && user.role !== "admin") {
            router.push("/dashboard");
        }
    }, [user, isLoading, router, requiredRole]);

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="spinner" style={{ borderColor: "rgba(26,71,49,0.3)", borderTopColor: "#1a4731", width: 36, height: 36 }} />
                    <p style={{ color: "#6b7280", fontSize: 13, marginTop: 12 }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    if (requiredRole && user.role !== requiredRole && user.role !== "admin") return null;

    return <>{children}</>;
}
