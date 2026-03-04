"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    ai_system_prompt: string | null;
    ai_user_summary: string | null;
};

export default function AdminAISettingsPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState("");
    const [editSummary, setEditSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            // 先嘗試含 AI 欄位；若 migration 未跑則降級
            let data: Profile[] | null = null;
            const { data: fullData, error: fullErr } = await supabase
                .from("profiles")
                .select("id, email, full_name, role, ai_system_prompt, ai_user_summary")
                .neq("role", "admin")
                .order("full_name", { ascending: true });

            if (fullErr && !fullData) {
                // 欄位可能尚未建立
                const { data: basicData } = await supabase
                    .from("profiles")
                    .select("id, email, full_name, role")
                    .neq("role", "admin")
                    .order("full_name", { ascending: true });
                data = (basicData || []).map(p => ({
                    ...p,
                    ai_system_prompt: null,
                    ai_user_summary: null,
                }));
            } else {
                data = fullData;
            }

            setProfiles(data || []);
        } catch (err) {
            console.error("載入失敗:", err);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (profile: Profile) => {
        setEditingId(profile.id);
        setEditPrompt(profile.ai_system_prompt || "");
        setEditSummary(profile.ai_user_summary || "");
        setMessage(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditPrompt("");
        setEditSummary("");
    };

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/ai-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: editingId,
                    ai_system_prompt: editPrompt.trim() || null,
                    ai_user_summary: editSummary.trim() || null,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "更新失敗");

            setMessage({ type: "success", text: "AI 設定已儲存 ✓" });
            setEditingId(null);
            loadProfiles();
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "更新失敗" });
        } finally {
            setSaving(false);
        }
    };

    const filteredProfiles = profiles.filter((p) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.email.toLowerCase().includes(term) ||
            (p.full_name && p.full_name.toLowerCase().includes(term))
        );
    });

    const configuredCount = profiles.filter(
        (p) => p.ai_system_prompt || p.ai_user_summary
    ).length;

    return (
        <section className="space-y-8">
            <header>
                <h1 className="text-2xl font-semibold text-white/90">🤖 AI 個人化設定</h1>
                <p className="mt-1 text-sm text-white/60">
                    為每位用戶設定專屬的 System Prompt 和 User Summary，LLM 回覆時會優先使用這裡的設定。
                </p>
                <div className="mt-3 flex gap-4 text-sm">
                    <div className="rounded-xl bg-purple-500/20 px-4 py-2 text-purple-200">
                        <span className="text-lg font-bold">{configuredCount}</span> 已設定
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-2 text-white/70">
                        <span className="text-lg font-bold">{profiles.length - configuredCount}</span> 使用預設
                    </div>
                </div>
            </header>

            {message && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        message.type === "success"
                            ? "border-green-500/50 bg-green-500/20 text-green-100"
                            : "border-red-500/50 bg-red-500/20 text-red-100"
                    }`}
                >
                    {message.text}
                </div>
            )}

            <article className="glass-card p-6">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="搜尋 Email 或姓名..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:w-80"
                    />
                </div>

                {loading ? (
                    <div className="py-8 text-center text-white/60">載入中...</div>
                ) : filteredProfiles.length === 0 ? (
                    <div className="py-8 text-center text-white/60">沒有符合的會員</div>
                ) : (
                    <div className="space-y-3">
                        {filteredProfiles.map((profile) => (
                            <div
                                key={profile.id}
                                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
                            >
                                {/* 標題列 */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold uppercase">
                                            {(profile.full_name || profile.email).slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white/90">
                                                {profile.full_name || "(未設定)"}
                                            </p>
                                            <p className="text-xs text-white/50">{profile.email}</p>
                                        </div>
                                        {(profile.ai_system_prompt || profile.ai_user_summary) && (
                                            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                                                已客製化
                                            </span>
                                        )}
                                    </div>
                                    {editingId !== profile.id && (
                                        <button
                                            onClick={() => startEdit(profile)}
                                            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                                        >
                                            ✏️ 編輯 AI 設定
                                        </button>
                                    )}
                                </div>

                                {/* 已有設定的預覽 */}
                                {editingId !== profile.id && (profile.ai_system_prompt || profile.ai_user_summary) && (
                                    <div className="mt-3 space-y-2 text-xs">
                                        {profile.ai_system_prompt && (
                                            <div>
                                                <span className="text-white/40">System Prompt：</span>
                                                <span className="text-white/60">{profile.ai_system_prompt.slice(0, 80)}...</span>
                                            </div>
                                        )}
                                        {profile.ai_user_summary && (
                                            <div>
                                                <span className="text-white/40">User Summary：</span>
                                                <span className="text-white/60">{profile.ai_user_summary.slice(0, 80)}...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 編輯表單 */}
                                {editingId === profile.id && (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-white/60">
                                                System Prompt（覆蓋共用模板中的用戶描述部分）
                                            </label>
                                            <textarea
                                                value={editPrompt}
                                                onChange={(e) => setEditPrompt(e.target.value)}
                                                placeholder={`例如：\n這位玩家是重度色違收藏家，特別關注第三世代寶可夢。他喜歡被稱讚收藏品味，回覆時可以提到他的色違收藏很厲害。語氣可以更熟絡一些，像老朋友的感覺。`}
                                                rows={4}
                                                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                                            />
                                            <p className="mt-1 text-[10px] text-white/30">
                                                留空 = 使用共用模板。填寫後 LLM 會在 system prompt 中加入這段描述。
                                            </p>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-white/60">
                                                User Summary（用戶摘要，注入對話上下文）
                                            </label>
                                            <textarea
                                                value={editSummary}
                                                onChange={(e) => setEditSummary(e.target.value)}
                                                placeholder={`例如：\n- 收藏偏好：色違、神獸、活動限定\n- 活躍程度：每週出價 3-5 次\n- 特殊身份：社群元老\n- 互動風格：喜歡聊天、會回覆其他人`}
                                                rows={4}
                                                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                                            />
                                            <p className="mt-1 text-[10px] text-white/30">
                                                留空 = 自動從 DB 查 bio + 收藏數。填寫後會覆蓋自動摘要。
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={saveEdit}
                                                disabled={saving}
                                                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50"
                                            >
                                                {saving ? "儲存中..." : "💾 儲存"}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </article>
        </section>
    );
}
