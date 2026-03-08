"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Route } from "next";

type RankingUser = {
    id: string;
    displayName: string;
    username?: string;
    score: number;
    isVirtual: boolean;
};

export function PopularityWidget() {
    const [topUsers, setTopUsers] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [myScore, setMyScore] = useState<number | null>(null);

    useEffect(() => {
        async function loadTop3() {
            try {
                const res = await fetch("/api/popularity?action=rankings&limit=3");
                const data = await res.json();
                if (data.rankings) {
                    setTopUsers(data.rankings.slice(0, 3));
                }
                if (data.myRank) setMyRank(data.myRank);
                if (data.myScore !== null && data.myScore !== undefined) setMyScore(data.myScore);
            } catch (error) {
                console.error("Load top3 error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadTop3();
    }, []);

    if (loading) {
        return (
            <div className="glass-card p-4 animate-pulse">
                <div className="h-4 w-24 bg-white/10 rounded mb-3"></div>
                <div className="space-y-2">
                    <div className="h-8 bg-white/5 rounded"></div>
                    <div className="h-8 bg-white/5 rounded"></div>
                    <div className="h-8 bg-white/5 rounded"></div>
                </div>
            </div>
        );
    }

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">🔥 人氣 Top 3</h3>
                <Link href="/rankings" className="text-xs text-amber-400 hover:underline">
                    查看更多
                </Link>
            </div>
            <div className="p-3 space-y-2">
                {topUsers.map((user, idx) => {
                    const userLink = user.isVirtual ? `/user/${user.id}` : (user.username ? `/user/${user.username}` : `/user/${user.id}`);

                    return (
                        <Link
                            key={user.id}
                            href={userLink as Route}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition"
                        >
                            <span className="text-lg">{medals[idx]}</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-bold text-white">
                                {user.displayName.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="flex-1 text-sm text-white truncate">
                                {user.displayName}
                            </span>
                            <span className="text-sm font-bold text-amber-400">
                                {user.score}
                            </span>
                        </Link>
                    );
                })}
                {topUsers.length === 0 && (
                    <p className="text-xs text-white/40 text-center py-2">暫無數據</p>
                )}
            </div>
            {/* 自己的排名 */}
            {myRank !== null && (
                <div className="px-3 pb-3 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-3 py-2">
                        <span className="text-xs text-white/60">📍 你的排名</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-amber-400">第 {myRank} 名</span>
                            {myScore !== null && (
                                <span className="text-xs text-white/40">({myScore} 分)</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
