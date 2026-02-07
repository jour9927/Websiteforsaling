"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
    id: string;
    full_name: string | null;
    email: string;
};

type VirtualProfile = {
    id: string;
    display_name: string;
    avatar_url: string | null;
};

type Comment = {
    id: string;
    profile_user_id: string;
    content: string;
    is_virtual: boolean;
    created_at: string;
    virtual_commenter_id: string | null;
    virtual_commenter?: VirtualProfile;
    target_user?: Profile;
};

// 預設留言範本
const COMMENT_TEMPLATES = [
    "收藏好漂亮！🌟",
    "大佬帶帶我 🙏",
    "什麼時候再上新的？",
    "好羨慕你的收藏",
    "這個配布我也有！",
    "可以交流一下嗎？",
    "新手報到！學習中 📚",
    "你的願望清單我都想要 😂",
    "收藏家 respect 🫡",
    "路過留言～",
    "太強了吧這收藏！",
    "期待你的新增收藏 👀",
];

export default function AdminVirtualCommentsPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [virtualProfiles, setVirtualProfiles] = useState<VirtualProfile[]>([]);
    const [recentComments, setRecentComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 表單狀態
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedVirtualUser, setSelectedVirtualUser] = useState("");
    const [commentContent, setCommentContent] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 載入真實用戶
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .order("full_name");
            if (profilesError) throw profilesError;
            setProfiles(profilesData || []);

            // 載入虛擬用戶
            const { data: virtualData, error: virtualError } = await supabase
                .from("virtual_profiles")
                .select("id, display_name, avatar_url")
                .order("display_name");
            if (virtualError) throw virtualError;
            setVirtualProfiles(virtualData || []);

            // 載入最近的虛擬留言
            const { data: commentsData, error: commentsError } = await supabase
                .from("profile_comments")
                .select("*")
                .eq("is_virtual", true)
                .order("created_at", { ascending: false })
                .limit(20);
            if (commentsError) throw commentsError;
            setRecentComments(commentsData || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : "載入失敗");
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!selectedUser || !selectedVirtualUser || !commentContent.trim()) {
            setError("請填寫所有欄位");
            return;
        }

        setSending(true);
        setError("");
        setSuccess("");

        try {
            const { error } = await supabase.from("profile_comments").insert({
                profile_user_id: selectedUser,
                commenter_id: null,
                virtual_commenter_id: selectedVirtualUser,
                is_virtual: true,
                content: commentContent.trim(),
            });

            if (error) throw error;

            setSuccess("留言發送成功！");
            setCommentContent("");
            loadData(); // 重新載入
        } catch (err) {
            setError(err instanceof Error ? err.message : "發送失敗");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("確定要刪除這則留言嗎？")) return;

        try {
            const { error } = await supabase
                .from("profile_comments")
                .delete()
                .eq("id", commentId);

            if (error) throw error;
            setSuccess("留言已刪除");
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "刪除失敗");
        }
    };

    const filteredProfiles = profiles.filter(
        (p) =>
            !searchTerm ||
            p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getVirtualUserName = (id: string) => {
        const vp = virtualProfiles.find((v) => v.id === id);
        return vp?.display_name || "未知";
    };

    const getUserName = (id: string) => {
        const p = profiles.find((u) => u.id === id);
        return p?.full_name || p?.email || "未知";
    };

    return (
        <section className="space-y-8">
            <header>
                <h1 className="text-2xl font-semibold text-white/90">🤖 水軍留言管理</h1>
                <p className="text-sm text-white/60">
                    以虛擬用戶身份在真實用戶的個人頁面留言
                </p>
            </header>

            {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm text-green-100">
                    {success}
                </div>
            )}

            {/* 發送留言表單 */}
            <article className="glass-card p-6">
                <h2 className="mb-4 text-lg font-medium text-white/90">📝 發送新留言</h2>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* 選擇目標用戶 */}
                    <div>
                        <label className="mb-2 block text-sm text-white/70">目標用戶</label>
                        <input
                            type="text"
                            placeholder="搜尋用戶..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
                        />
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                        >
                            <option value="">選擇用戶...</option>
                            {filteredProfiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || "(未設定)"} - {p.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 選擇虛擬用戶 */}
                    <div>
                        <label className="mb-2 block text-sm text-white/70">留言者（虛擬用戶）</label>
                        <select
                            value={selectedVirtualUser}
                            onChange={(e) => setSelectedVirtualUser(e.target.value)}
                            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                        >
                            <option value="">選擇虛擬用戶...</option>
                            {virtualProfiles.map((vp) => (
                                <option key={vp.id} value={vp.id}>
                                    {vp.display_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 留言內容 */}
                <div className="mt-4">
                    <label className="mb-2 block text-sm text-white/70">留言內容</label>
                    <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="輸入留言內容..."
                        rows={3}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
                    />
                </div>

                {/* 快速範本 */}
                <div className="mt-3">
                    <p className="mb-2 text-xs text-white/50">快速範本：</p>
                    <div className="flex flex-wrap gap-2">
                        {COMMENT_TEMPLATES.map((template, i) => (
                            <button
                                key={i}
                                onClick={() => setCommentContent(template)}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:bg-white/20 hover:text-white"
                            >
                                {template}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 發送按鈕 */}
                <button
                    onClick={handleSendComment}
                    disabled={sending || !selectedUser || !selectedVirtualUser || !commentContent.trim()}
                    className="mt-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                    {sending ? "發送中..." : "🚀 發送留言"}
                </button>
            </article>

            {/* 最近的虛擬留言 */}
            <article className="glass-card p-6">
                <h2 className="mb-4 text-lg font-medium text-white/90">
                    📜 最近的虛擬留言 ({recentComments.length})
                </h2>

                {loading ? (
                    <div className="text-center text-white/60">載入中...</div>
                ) : recentComments.length === 0 ? (
                    <div className="text-center text-white/60">還沒有虛擬留言</div>
                ) : (
                    <div className="space-y-3">
                        {recentComments.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex items-start justify-between rounded-lg bg-white/5 p-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-purple-300">
                                            {getVirtualUserName(comment.virtual_commenter_id || "")}
                                        </span>
                                        <span className="text-white/40">→</span>
                                        <span className="text-blue-300">
                                            {getUserName(comment.profile_user_id)}
                                        </span>
                                        <span className="text-xs text-white/40">
                                            {new Date(comment.created_at).toLocaleString("zh-TW")}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-white/80">{comment.content}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="ml-3 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/30"
                                >
                                    刪除
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </article>
        </section>
    );
}
