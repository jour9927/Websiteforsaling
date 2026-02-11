"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type StampRecord = {
    id: string;
    user_id: string;
    stamp_count: number;
    profiles: { full_name: string | null; email: string } | null;
};

type RewardRecord = {
    id: string;
    user_id: string;
    created_at: string;
    distributions: { pokemon_name: string; pokemon_sprite_url: string | null } | null;
    profiles: { full_name: string | null; email: string } | null;
};

type QuizAttempt = {
    id: string;
    user_id: string;
    score: number;
    passed: boolean;
    created_at: string;
    profiles: { full_name: string | null; email: string } | null;
};

export default function AdminEeveeDayPage() {
    const [stamps, setStamps] = useState<StampRecord[]>([]);
    const [rewards, setRewards] = useState<RewardRecord[]>([]);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"overview" | "stamps" | "rewards" | "attempts">("overview");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [stampsRes, rewardsRes, attemptsRes] = await Promise.all([
                supabase
                    .from("eevee_day_stamps")
                    .select("*, profiles(full_name, email)")
                    .order("stamp_count", { ascending: false }),
                supabase
                    .from("eevee_day_rewards")
                    .select("*, distributions(pokemon_name, pokemon_sprite_url), profiles(full_name, email)")
                    .order("created_at", { ascending: false }),
                supabase
                    .from("eevee_day_quiz_attempts")
                    .select("*, profiles(full_name, email)")
                    .order("created_at", { ascending: false })
                    .limit(50),
            ]);

            setStamps((stampsRes.data as StampRecord[]) || []);
            setRewards((rewardsRes.data as RewardRecord[]) || []);
            setAttempts((attemptsRes.data as QuizAttempt[]) || []);
        } catch (err) {
            console.error("載入活動數據失敗:", err);
        } finally {
            setLoading(false);
        }
    };

    // 統計數據
    const totalParticipants = stamps.length;
    const completedUsers = stamps.filter(s => s.stamp_count >= 7).length;
    const rewardsClaimed = rewards.length;
    const totalAttempts = attempts.length;
    const passRate = totalAttempts > 0
        ? Math.round((attempts.filter(a => a.passed).length / totalAttempts) * 100)
        : 0;
    const avgScore = totalAttempts > 0
        ? (attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts).toFixed(1)
        : "0";

    if (loading) {
        return (
            <section className="space-y-8">
                <header>
                    <h1 className="text-2xl font-semibold text-white/90">🎯 伊步集點日管理</h1>
                </header>
                <div className="text-center text-white/60 py-12">載入中...</div>
            </section>
        );
    }

    return (
        <section className="space-y-8">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white/90">🎯 伊步集點日管理</h1>
                    <p className="text-sm text-white/60">查看活動參與狀況、集點進度、獎勵領取紀錄。</p>
                </div>
                <button
                    onClick={() => { setLoading(true); loadData(); }}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/20"
                >
                    🔄 重新整理
                </button>
            </header>

            {/* 總覽統計卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{totalParticipants}</p>
                    <p className="text-xs text-white/60 mt-1">參與人數</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{completedUsers}</p>
                    <p className="text-xs text-white/60 mt-1">已集滿 7 點</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">{rewardsClaimed}</p>
                    <p className="text-xs text-white/60 mt-1">已領獎</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{totalAttempts}</p>
                    <p className="text-xs text-white/60 mt-1">答題次數</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{passRate}%</p>
                    <p className="text-xs text-white/60 mt-1">通過率</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{avgScore}</p>
                    <p className="text-xs text-white/60 mt-1">平均分數</p>
                </div>
            </div>

            {/* 分頁切換 */}
            <div className="flex gap-2">
                {(["overview", "stamps", "rewards", "attempts"] as const).map((t) => {
                    const labels = { overview: "📋 總覽", stamps: "⭐ 集點進度", rewards: "🎁 獎勵紀錄", attempts: "📝 答題紀錄" };
                    return (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`rounded-full px-4 py-2 text-sm transition ${tab === t ? "bg-white/20 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {labels[t]}
                        </button>
                    );
                })}
            </div>

            {/* 集點進度表 */}
            {(tab === "overview" || tab === "stamps") && (
                <article className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white/90 mb-4">⭐ 集點進度（{stamps.length} 人）</h2>
                    {stamps.length === 0 ? (
                        <p className="text-center text-white/60 py-8">尚無參與者</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                                <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                                    <tr>
                                        <th className="px-4 py-3">用戶</th>
                                        <th className="px-4 py-3">集點</th>
                                        <th className="px-4 py-3">進度</th>
                                        <th className="px-4 py-3">狀態</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {stamps.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-white/90">{s.profiles?.full_name || "(未設定)"}</p>
                                                    <p className="text-xs text-white/50">{s.profiles?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-amber-400">{s.stamp_count}/7</td>
                                            <td className="px-4 py-3 w-32">
                                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                                                        style={{ width: `${Math.min((s.stamp_count / 7) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.stamp_count >= 7 ? (
                                                    <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400">
                                                        ✅ 已集滿
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-white/10 text-white/60">
                                                        進行中
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            )}

            {/* 獎勵紀錄表 */}
            {(tab === "overview" || tab === "rewards") && (
                <article className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white/90 mb-4">🎁 獎勵領取紀錄（{rewards.length} 人）</h2>
                    {rewards.length === 0 ? (
                        <p className="text-center text-white/60 py-8">尚無人領取獎勵</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                                <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                                    <tr>
                                        <th className="px-4 py-3">用戶</th>
                                        <th className="px-4 py-3">選擇的寶可夢</th>
                                        <th className="px-4 py-3">領取時間</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {rewards.map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-white/90">{r.profiles?.full_name || "(未設定)"}</p>
                                                    <p className="text-xs text-white/50">{r.profiles?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {r.distributions?.pokemon_sprite_url && (
                                                        <img
                                                            src={r.distributions.pokemon_sprite_url}
                                                            alt=""
                                                            className="w-8 h-8 object-contain"
                                                        />
                                                    )}
                                                    <span className="font-medium text-amber-400">
                                                        {r.distributions?.pokemon_name || "未知"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-white/60">
                                                {new Date(r.created_at).toLocaleString("zh-TW")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            )}

            {/* 答題紀錄表 */}
            {tab === "attempts" && (
                <article className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white/90 mb-4">📝 最近答題紀錄（最新 50 筆）</h2>
                    {attempts.length === 0 ? (
                        <p className="text-center text-white/60 py-8">尚無答題紀錄</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                                <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                                    <tr>
                                        <th className="px-4 py-3">用戶</th>
                                        <th className="px-4 py-3">分數</th>
                                        <th className="px-4 py-3">結果</th>
                                        <th className="px-4 py-3">時間</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {attempts.map((a) => (
                                        <tr key={a.id}>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-white/90">{a.profiles?.full_name || "(未設定)"}</p>
                                                    <p className="text-xs text-white/50">{a.profiles?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold">{a.score}/10</td>
                                            <td className="px-4 py-3">
                                                {a.passed ? (
                                                    <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400">
                                                        ✅ 通過
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-red-500/20 text-red-400">
                                                        ❌ 未通過
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-white/60">
                                                {new Date(a.created_at).toLocaleString("zh-TW")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            )}
        </section>
    );
}
