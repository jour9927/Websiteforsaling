"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type User = {
    id: string;
    full_name: string | null;
    username: string | null;
};



type PublicPerception = {
    id: string;
    user_id: string;
    content: string;
    agree_rate: number;
    disagree_rate: number;
    participation_rate: number;
    sort_order: number;
};

export default function PublicImageAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // 公眾形象名
    const [nickname, setNickname] = useState("");
    const [approvalRate, setApprovalRate] = useState(80);

    // 公眾認知
    const [perceptions, setPerceptions] = useState<PublicPerception[]>([]);
    const [newPerception, setNewPerception] = useState({
        content: "",
        agree_rate: 80,
        disagree_rate: 10,
        participation_rate: 50,
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // 載入用戶列表
    useEffect(() => {
        async function loadUsers() {
            const { data } = await supabase
                .from("profiles")
                .select("id, full_name, username")
                .order("full_name");
            setUsers(data || []);
            setLoading(false);
        }
        loadUsers();
    }, []);

    // 載入選中用戶的資料
    useEffect(() => {
        async function loadUserData() {
            if (!selectedUserId) return;

            // 載入公眾形象名
            const { data: imageData } = await supabase
                .from("public_images")
                .select("*")
                .eq("user_id", selectedUserId)
                .single();

            if (imageData) {
                setNickname(imageData.nickname || "");
                setApprovalRate(imageData.approval_rate);
            } else {
                setNickname("");
                setApprovalRate(80);
            }

            // 載入公眾認知
            const { data: perceptionData } = await supabase
                .from("public_perceptions")
                .select("*")
                .eq("user_id", selectedUserId)
                .order("sort_order");

            setPerceptions(perceptionData || []);
        }
        loadUserData();
    }, [selectedUserId]);

    // 過濾用戶
    const filteredUsers = users.filter(
        (u) =>
            (u.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (u.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    // 儲存公眾形象名
    const handleSaveImage = async () => {
        if (!selectedUserId) return;
        setSaving(true);
        setMessage("");

        const { error } = await supabase
            .from("public_images")
            .upsert({
                user_id: selectedUserId,
                nickname,
                approval_rate: approvalRate,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

        if (error) {
            setMessage(`錯誤: ${error.message}`);
        } else {
            setMessage("公眾形象名已儲存！");
        }
        setSaving(false);
    };

    // 新增公眾認知
    const handleAddPerception = async () => {
        if (!selectedUserId || !newPerception.content.trim()) return;
        setSaving(true);

        const { error } = await supabase
            .from("public_perceptions")
            .insert({
                user_id: selectedUserId,
                content: newPerception.content.trim(),
                agree_rate: newPerception.agree_rate,
                disagree_rate: newPerception.disagree_rate,
                participation_rate: newPerception.participation_rate,
                sort_order: perceptions.length,
            });

        if (error) {
            setMessage(`錯誤: ${error.message}`);
        } else {
            setMessage("已新增公眾認知！");
            setNewPerception({ content: "", agree_rate: 80, disagree_rate: 10, participation_rate: 50 });
            // 重新載入
            const { data } = await supabase
                .from("public_perceptions")
                .select("*")
                .eq("user_id", selectedUserId)
                .order("sort_order");
            setPerceptions(data || []);
        }
        setSaving(false);
    };

    // 刪除公眾認知
    const handleDeletePerception = async (id: string) => {
        const { error } = await supabase
            .from("public_perceptions")
            .delete()
            .eq("id", id);

        if (!error) {
            setPerceptions(perceptions.filter((p) => p.id !== id));
        }
    };

    if (loading) {
        return <div className="p-8 text-white/60">載入中...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">🎭 公眾形象管理</h1>

            {/* 用戶選擇 */}
            <div className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">選擇用戶</h2>
                <input
                    type="text"
                    placeholder="搜尋用戶..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40"
                />
                <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white"
                >
                    <option value="">-- 選擇用戶 --</option>
                    {filteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.full_name || u.username || "未命名用戶"}
                        </option>
                    ))}
                </select>
            </div>

            {selectedUserId && (
                <>
                    {/* 公眾形象名設定 */}
                    <div className="glass-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">📛 公眾形象名</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-white/60">暱稱</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="例如：收藏達人"
                                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-white/60">認可度 %</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={approvalRate}
                                        onChange={(e) => setApprovalRate(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="w-12 text-right text-white">{approvalRate}%</span>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveImage}
                                disabled={saving}
                                className="rounded-lg bg-blue-500/20 px-4 py-2 text-blue-200 hover:bg-blue-500/30 disabled:opacity-50"
                            >
                                儲存公眾形象名
                            </button>
                        </div>
                    </div>

                    {/* 公眾認知設定 */}
                    <div className="glass-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">💭 公眾認知</h2>

                        {/* 現有認知 */}
                        {perceptions.length > 0 && (
                            <div className="mb-6 space-y-2">
                                {perceptions.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                                        <div>
                                            <span className="text-white">&ldquo;{p.content}&rdquo;</span>
                                            <span className="ml-4 text-sm text-white/50">
                                                認同 {p.agree_rate}% 不認同 {p.disagree_rate}% (參與 {p.participation_rate} 人)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePerception(p.id)}
                                            className="text-red-400/60 hover:text-red-400"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 新增認知 */}
                        <div className="space-y-4 rounded-lg border border-white/10 p-4">
                            <h3 className="text-sm font-medium text-white/80">新增認知</h3>
                            <input
                                type="text"
                                value={newPerception.content}
                                onChange={(e) => setNewPerception({ ...newPerception, content: e.target.value })}
                                placeholder="例如：收藏品味獨到"
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white"
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs text-white/60">認同 %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newPerception.agree_rate}
                                        onChange={(e) => setNewPerception({ ...newPerception, agree_rate: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-white/60">不認同 %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newPerception.disagree_rate}
                                        onChange={(e) => setNewPerception({ ...newPerception, disagree_rate: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-white/60">參與人數</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newPerception.participation_rate}
                                        onChange={(e) => setNewPerception({ ...newPerception, participation_rate: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddPerception}
                                disabled={saving || !newPerception.content.trim()}
                                className="rounded-lg bg-green-500/20 px-4 py-2 text-green-200 hover:bg-green-500/30 disabled:opacity-50"
                            >
                                新增認知
                            </button>
                        </div>
                    </div>
                </>
            )}

            {message && (
                <div className={`rounded-lg p-3 text-center ${message.includes("錯誤") ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>
                    {message}
                </div>
            )}
        </div>
    );
}
