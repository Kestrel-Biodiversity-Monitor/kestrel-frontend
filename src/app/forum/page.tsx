"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import { toast } from "react-toastify";
import { ForumPost, Comment } from "@/types";

const CATEGORIES = ["All", "General", "Research", "Field Notes", "Conservation", "Help", "Announcements"];

export default function ForumPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [newPostModal, setNewPostModal] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [postForm, setPostForm] = useState({ title: "", category: "General", description: "" });

    const loadPosts = async () => {
        setLoading(true);
        try {
            const q = category !== "All" ? `?category=${category}` : "";
            const r = await api.get(`/forum${q}`);
            setPosts(r.data.posts);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadPosts(); }, [category]);

    const openPost = async (post: ForumPost) => {
        setSelectedPost(post);
        try {
            const r = await api.get(`/forum/${post._id}`);
            setSelectedPost(r.data.post);
            setComments(r.data.comments);
        } catch { toast.error("Failed to load post"); }
    };

    const submitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/forum", postForm);
            toast.success("Post created!");
            setNewPostModal(false);
            setPostForm({ title: "", category: "General", description: "" });
            loadPosts();
        } catch { toast.error("Failed to post"); }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPost || !commentText.trim()) return;
        try {
            const r = await api.post(`/forum/${selectedPost._id}/comments`, { comment: commentText });
            setComments((c) => [...c, r.data]);
            setCommentText("");
        } catch { toast.error("Failed to comment"); }
    };

    const upvote = async (postId: string) => {
        try {
            await api.patch(`/forum/${postId}/upvote`);
            loadPosts();
        } catch { /* ignore */ }
    };

    const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setPostForm((f) => ({ ...f, [k]: e.target.value }));

    return (
        <ProtectedRoute>
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <div style={{ padding: "28px" }}>
                        <div className="page-header">
                            <div><h1 className="page-title">Community Forum</h1><p className="page-subtitle">Share insights, research, and field observations</p></div>
                            <button className="btn btn-primary" onClick={() => setNewPostModal(true)}>+ New Post</button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>
                            {/* Category filter */}
                            <div className="card" style={{ height: "fit-content" }}>
                                <div className="card-title" style={{ marginBottom: 12 }}>Categories</div>
                                {CATEGORIES.map((c) => (
                                    <button key={c} onClick={() => setCategory(c)}
                                        style={{
                                            display: "block", width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 6, border: "none",
                                            background: category === c ? "#e8f5ee" : "transparent", color: category === c ? "#1a4731" : "#4b5563",
                                            fontWeight: category === c ? 600 : 400, fontSize: 13, cursor: "pointer", marginBottom: 2
                                        }}>
                                        {c}
                                    </button>
                                ))}
                            </div>

                            {/* Post list */}
                            <div>
                                {loading ? (
                                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                                        <div className="spinner" style={{ width: 28, height: 28, borderColor: "rgba(26,71,49,0.2)", borderTopColor: "#1a4731" }} />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af", fontSize: 14 }}>
                                        No posts in this category yet. Be the first to post!
                                    </div>
                                ) : (
                                    posts.map((p) => (
                                        <div key={p._id} className="card" style={{ marginBottom: 12, cursor: "pointer" }}
                                            onClick={() => openPost(p)}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div style={{ flex: 1 }}>
                                                    {p.isPinned && <span style={{ fontSize: 11, color: "#1a4731", fontWeight: 600, marginBottom: 4, display: "block" }}>📌 PINNED</span>}
                                                    <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#111827" }}>{p.title}</h3>
                                                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                                                        {p.description.length > 160 ? p.description.slice(0, 160) + "..." : p.description}
                                                    </p>
                                                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9ca3af" }}>
                                                        <span>by <strong style={{ color: "#374151" }}>{p.userId?.name}</strong></span>
                                                        <span className={`badge badge-${p.userId?.role}`}>{p.userId?.role}</span>
                                                        <span>👁 {p.viewCount}</span>
                                                        <span>👍 {p.upvotes?.length || 0}</span>
                                                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                                    <span style={{ fontSize: 11, background: "#f3f4f6", color: "#4b5563", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>{p.category}</span>
                                                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); upvote(p._id); }} style={{ fontSize: 13 }}>
                                                        👍 {p.upvotes?.length || 0}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Detail Modal */}
            <Modal isOpen={!!selectedPost} onClose={() => { setSelectedPost(null); setComments([]); }} title={selectedPost?.title || ""} size="lg">
                {selectedPost && (
                    <>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                            <span className={`badge badge-${selectedPost.userId?.role}`}>{selectedPost.userId?.role}</span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>by {selectedPost.userId?.name} · {new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 24, whiteSpace: "pre-wrap" }}>{selectedPost.description}</p>
                        <hr className="divider" />
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Comments ({comments.length})</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
                            {comments.map((c) => (
                                <div key={c._id} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
                                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                                        <strong style={{ color: "#374151" }}>{c.userId?.name}</strong> · {new Date(c.createdAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#374151" }}>{c.comment}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No comments yet</p>}
                        </div>
                        <form onSubmit={submitComment} style={{ display: "flex", gap: 8 }}>
                            <input className="form-input" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ flex: 1 }} />
                            <button className="btn btn-primary" type="submit">Post</button>
                        </form>
                    </>
                )}
            </Modal>

            {/* New Post Modal */}
            <Modal isOpen={newPostModal} onClose={() => setNewPostModal(false)} title="New Forum Post"
                footer={<><button className="btn btn-secondary" onClick={() => setNewPostModal(false)}>Cancel</button><button form="post-form" className="btn btn-primary" type="submit">Publish</button></>}>
                <form id="post-form" onSubmit={submitPost}>
                    <div className="form-group"><label className="form-label">Title *</label><input className="form-input" required value={postForm.title} onChange={setF("title")} placeholder="What's this about?" /></div>
                    <div className="form-group"><label className="form-label">Category</label>
                        <select className="form-select" value={postForm.category} onChange={setF("category")}>
                            {["General", "Research", "Field Notes", "Conservation", "Help", "Announcements"].map((c) => <option key={c}>{c}</option>)}
                        </select></div>
                    <div className="form-group"><label className="form-label">Description *</label>
                        <textarea className="form-textarea" required value={postForm.description} onChange={setF("description") as any} placeholder="Share your thoughts, findings, or questions..." style={{ minHeight: 140 }} />
                    </div>
                </form>
            </Modal>
        </ProtectedRoute>
    );
}
