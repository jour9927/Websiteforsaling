"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type UserRanking = {
    id: string;
    displayName: string;
    username?: string;
    score: number;
    followers: number;
    isVirtual: boolean;
};

type EditMode = "score" | "followers" | null;

export default function AdminPopularityPage() {
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<EditMode>(null);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const loadRankings = useCallback(async () => {
        try {
            const res = await fetch("/api/popularity?action=rankings&limit=100");
            const data = await res.json();
            if (data.rankings) {
                setRankings(data.rankings);
            }
        } catch (error) {
            console.error("Load rankings error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRankings();
    }, [loadRankings]);

    const handleEdit = (user: UserRanking, mode: EditMode) => {
        setEditingId(user.id);
        setEditMode(mode);
        setEditValue(String(mode === "score" ? user.score : user.followers));
    };

    const handleSave = async (user: UserRanking) => {
        const newValue = parseInt(editValue);
        if (isNaN(newValue) || newValue < 0) {
            setMessage("請輸入有效的數字");
            return;
        }

        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                userId: user.isVirtual ? null : user.id,
                virtualId: user.isVirtual ? user.id : null,
            };
            if (editMode === "score") {
                body.score = newValue;
            } else {
                body.followers = newValue;
            }

            const res = await fetch("/api/admin/popularity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.success) {
                setRankings(prev =>
                    prev.map(u => {
                        if (u.id === user.id) {
                            return {
                                ...u,
                                ...(editMode === "score" ? { score: newValue } : { followers: newValue })
                            };
                        }
                        return u;
                    }).sort((a, b) => b.score - a.score)
                );
                setMessage("更新成功！");
                setEditingId(null);
                setEditMode(null);
            } else {
                setMessage(data.error || "更新失敗");
            }
        } catch {
            setMessage("更新失敗");
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 2000);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditMode(null);
        setEditValue("");
    };

    const filteredRankings = rankings.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <section className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold text-white/90">社交數據管理</h1>
                </header>
                <div className="glass-card p-8 text-center">
                    <div className="animate-pulse text-white/60">載入中...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white/90">社交數據管理</h1>
                    <p className="mt-1 text-sm text-white/60">
                        調整用戶人氣值與被關注數，影響排行榜排名
                    </p>
                </div>
                <Link
                    href="/rankings"
                    className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm hover:bg-white/20 transition"
                >
                    查看公開排行榜 →
                </Link>
            </header>

            {message && (
                <div className={`glass-card p-3 text-center ${message.includes("成功") ? "text-emerald-400" : "text-red-400"}`}>
                    {message}
                </div>
            )}

            {/* 搜尋 */}
            <div className="glass-card p-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜尋用戶..."
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-500/50"
                />
            </div>

            {/* 排行榜表格 */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 text-left text-xs text-white/50">
                            <th className="p-4">排名</th>
                            <th className="p-4">用戶</th>
                            <th className="p-4">類型</th>
                            <th className="p-4">被關注數</th>
                            <th className="p-4">人氣值</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredRankings.map((user, idx) => (
                            <tr key={user.id} className="hover:bg-white/5">
                                <td className="p-4">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${idx < 3
                                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black"
                                        : "bg-white/10 text-white/60"
                                        }`}>
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                                            {user.displayName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{user.displayName}</p>
                                            {user.username && (
                                                <p className="text-xs text-white/50">@{user.username}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${user.isVirtual
                                        ? "bg-purple-500/20 text-purple-400"
                                        : "bg-blue-500/20 text-blue-400"
                                        }`}>
                                        {user.isVirtual ? "虛擬" : "真實"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {editingId === user.id && editMode === "followers" ? (
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-20 px-2 py-1 rounded bg-white/10 border border-blue-500/50 text-blue-400 text-center focus:outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(user, "followers")}
                                            className="text-white/70 hover:text-blue-400 transition"
                                            title="點擊編輯"
                                        >
                                            {user.followers}
                                        </button>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingId === user.id && editMode === "score" ? (
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-20 px-2 py-1 rounded bg-white/10 border border-amber-500/50 text-amber-400 text-center focus:outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(user, "score")}
                                            className="text-lg font-bold text-amber-400 hover:text-amber-300 transition"
                                            title="點擊編輯"
                                        >
                                            🔥 {user.score}
                                        </button>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingId === user.id ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSave(user)}
                                                disabled={saving}
                                                className="px-3 py-1 rounded bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 disabled:opacity-50"
                                            >
                                                {saving ? "..." : "儲存"}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="px-3 py-1 rounded bg-white/10 text-white/70 text-sm hover:bg-white/20"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-white/40">點擊數字編輯</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRankings.length === 0 && (
                    <div className="p-8 text-center text-white/50">
                        {searchTerm ? "沒有符合的搜尋結果" : "暫無排名數據"}
                    </div>
                )}
            </div>
        </section>
    );
}

