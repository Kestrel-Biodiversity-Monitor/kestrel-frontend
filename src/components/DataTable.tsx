"use client";

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => React.ReactNode;
    width?: string;
}

interface Props<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
    loading?: boolean;
}

export default function DataTable<T extends { _id: string }>({
    columns, data, emptyMessage = "No records found.", loading = false,
}: Props<T>) {
    if (loading) {
        return (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div className="spinner" style={{ width: 28, height: 28, borderColor: "rgba(26,71,49,0.2)", borderTopColor: "#1a4731" }} />
                <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 10 }}>Loading data...</p>
            </div>
        );
    }
    return (
        <div style={{ overflowX: "auto" }}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={String(col.key)} style={col.width ? { width: col.width } : undefined}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr key={row._id}>
                                {columns.map((col) => (
                                    <td key={String(col.key)}>
                                        {col.render ? col.render(row) : String((row as any)[col.key] ?? "—")}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
