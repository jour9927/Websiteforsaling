"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Route } from "next";

type RankingUser = {
    id: string;
    displayName: string;
    username?: string;
    avatarSeed?: string;
    score: number;
    followers: number;
    isVirtual: boolean;
};

export default function RankingsPage() {
    const [rankings, setRankings] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRankings() {
            try {
                const res = await fetch("/api/popularity?action=rankings&limit=50");
                const data = await res.json();
                if (data.rankings) {
                    setRankings(data.rankings);
                }
            } catch (error) {
                console.error("Load rankings error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadRankings();
    }, []);

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { emoji: "🥇", bg: "from-yellow-500/30 to-amber-500/10", border: "border-yellow-500/50" };
        if (rank === 2) return { emoji: "🥈", bg: "from-gray-400/30 to-gray-500/10", border: "border-gray-400/50" };
        if (rank === 3) return { emoji: "🥉", bg: "from-orange-600/30 to-orange-700/10", border: "border-orange-600/50" };
        return { emoji: "", bg: "from-white/5 to-transparent", border: "border-white/10" };
    };

    if (loading) {
        return (
            <section className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold text-white/90">🔥 人氣排行榜</h1>
                    <p className="mt-1 text-sm text-white/60">本週最受歡迎的用戶</p>
                </header>
                <div className="glass-card p-8 text-center">
                    <div className="animate-pulse text-white/60">載入中...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div>
                <header>
                    <h1 className="text-2xl font-semibold text-white/90">🔥 人氣排行榜</h1>
                    <p className="mt-1 text-sm text-white/60">
                        本週最受歡迎的用戶。每人每週可給同一人投 1 票，每月共 4 次額度。
                    </p>
                </header>

                {/* Top 3 特別區塊 */}
                {rankings.length >= 3 && (
                    <div className="grid grid-cols-3 gap-3">
                        {rankings.slice(0, 3).map((user, idx) => {
                            const rank = idx + 1;
                            const badge = getRankBadge(rank);
                            const userLink = user.isVirtual ? `/user/${user.id}` : (user.username ? `/user/${user.username}` : `/user/${user.id}`);

                            return (
                                <Link
                                    key={user.id}
                                    href={userLink as Route}
                                    className={`glass-card p-4 text-center border ${badge.border} bg-gradient-to-b ${badge.bg} hover:scale-105 transition`}
                                >
                                    <div className="text-3xl mb-2">{badge.emoji}</div>
                                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg">
                                        {user.displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-white truncate">
                                        {user.displayName}
                                    </p>
                                    <p className="text-2xl font-bold text-amber-400 mt-1">
                                        🔥 {user.score}
                                    </p>
                                    <p className="text-xs text-white/50">
                                        {user.followers} 關注者
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* 完整排行榜 */}
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white/80">完整排名</h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {rankings.map((user, idx) => {
                            const rank = idx + 1;
                            const badge = getRankBadge(rank);
                            const userLink = user.isVirtual ? `/user/${user.id}` : (user.username ? `/user/${user.username}` : `/user/${user.id}`);

                            return (
                                <Link
                                    key={user.id}
                                    href={userLink as Route}
                                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition"
                                >
                                    {/* 排名 */}
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rank <= 3 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black" : "bg-white/10 text-white/60"
                                        }`}>
                                        {badge.emoji || rank}
                                    </div>

                                    {/* 頭像 */}
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                                        {user.displayName.slice(0, 2).toUpperCase()}
                                    </div>

                                    {/* 名稱 */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {user.displayName}
                                            {user.isVirtual && <span className="ml-1 text-xs text-white/40">·</span>}
                                        </p>
                                        <p className="text-xs text-white/50">
                                            {user.followers} 關注者
                                        </p>
                                    </div>

                                    {/* 人氣值 */}
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-amber-400">🔥 {user.score}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {rankings.length === 0 && (
                        <div className="p-8 text-center text-white/50">
                            暫無排名數據
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
