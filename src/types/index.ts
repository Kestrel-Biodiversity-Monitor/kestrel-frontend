export interface User {
    _id: string;
    name: string;
    email: string;
    role: "user" | "officer" | "admin";
    organization?: string;
    bio?: string;
    profileImage?: string | null;
    contributionScore: number;
    roleUpgradeRequest?: boolean;
    roleUpgradeReason?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Species {
    _id: string;
    name: string;
    scientificName?: string;
    category: string;
    conservationStatus: string;
    habitat?: string;
    description?: string;
    imageUrl?: string | null;
    createdBy?: { _id: string; name: string };
    createdAt: string;
}

export interface SpeciesReport {
    _id: string;
    userId: { _id: string; name: string; email: string };
    speciesId?: { _id: string; name: string; category: string; conservationStatus: string };
    speciesName?: string;
    imageUrl?: string | null;
    location: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
        regionName?: string;
    };
    habitatType: string;
    observationType: string;
    numberOfIndividuals: number;
    weatherCondition: string;
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    description?: string;
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    isBulkUpload?: boolean;
    surveyName?: string;
    createdAt: string;
}

export interface Alert {
    _id: string;
    message: string;
    region: string;
    severity: "Info" | "Warning" | "Critical";
    status: "active" | "resolved";
    expiryDate?: string;
    createdBy?: { _id: string; name: string };
    feedbacks?: { userId: string; comment: string; createdAt: string }[];
    createdAt: string;
}

export interface Anomaly {
    _id: string;
    region: string;
    type: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    description?: string;
    detectedAt: string;
    status: "open" | "under_review" | "resolved";
    reportedBy?: { _id: string; name: string };
    reviewNotes?: string;
}

export interface ForumPost {
    _id: string;
    title: string;
    category: string;
    description: string;
    userId: { _id: string; name: string; profileImage?: string; role: string };
    upvotes: string[];
    isPinned: boolean;
    isLocked: boolean;
    viewCount: number;
    createdAt: string;
}

export interface Comment {
    _id: string;
    postId: string;
    userId: { _id: string; name: string; profileImage?: string };
    comment: string;
    upvotes: string[];
    createdAt: string;
}

export interface AnalyticsComparison {
    totals: {
        totalReports: number;
        approvedReports: number;
        pendingReports: number;
        totalSpecies: number;
        totalUsers: number;
    };
    conservationBreakdown: { label: string; value: number }[];
    habitatBreakdown: { label: string; value: number }[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pages: number;
}

export interface Document {
    _id: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileType: "pdf" | "csv" | "image" | "doc" | "other";
    mimeType?: string;
    fileSize?: number;
    uploadedBy: { _id: string; name: string; email: string; role: string };
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    approvedBy?: { _id: string; name: string } | null;
    approvedAt?: string | null;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}
