"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV = [
    { href: "/dashboard", icon: "◈", label: "Dashboard", roles: ["user", "researcher", "admin"] },
    { href: "/report", icon: "📋", label: "Submit Report", roles: ["user", "researcher", "admin"] },
    { href: "/analytics", icon: "📊", label: "Analytics", roles: ["user", "researcher", "admin"] },
    { href: "/forum", icon: "💬", label: "Community", roles: ["user", "researcher", "admin"] },
    { href: "/admin", icon: "⚙", label: "Admin Panel", roles: ["admin"] },
    { href: "/profile", icon: "👤", label: "Profile", roles: ["user", "researcher", "admin"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null;

    const navItems = NAV.filter((n) => n.roles.includes(user.role));

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-text">🦅 KESTREL</div>
                <div className="sidebar-logo-sub">Biodiversity Platform</div>
            </div>

            <div className="sidebar-nav">
                <div className="sidebar-section-label">Navigation</div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
                    >
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="sidebar-footer">
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, lineHeight: 1.4 }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{user.name}</span><br />
                    <span style={{ textTransform: "capitalize" }}>{user.role}</span>
                    {user.contributionScore > 0 && (
                        <span style={{ marginLeft: 6, color: "#5cb887" }}>· {user.contributionScore} pts</span>
                    )}
                </div>
                <button className="btn btn-ghost btn-sm btn-block" onClick={logout}
                    style={{ color: "rgba(255,255,255,0.5)", justifyContent: "flex-start" }}>
                    ↩ Sign out
                </button>
            </div>
        </nav>
    );
}
