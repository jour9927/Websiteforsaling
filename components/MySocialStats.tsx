"use client";

import { useState, useEffect } from "react";
import { FollowListModal } from "./FollowListModal";

type MySocialStatsProps = {
    userId: string;
};

export function MySocialStats({ userId }: MySocialStatsProps) {
    const [stats, setStats] = useState({
        followers_count: 0,
        following_count: 0,
        popularity_score: 0
    });
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch(`/api/follow?userId=${userId}`);
                const data = await res.json();
                setStats({
                    followers_count: data.followers_count || 0,
                    following_count: data.following_count || 0,
                    popularity_score: data.popularity_score || 0
                });
            } catch (error) {
                console.error("Load stats error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex gap-3 animate-pulse">
                <div className="h-14 w-20 rounded-lg bg-white/10"></div>
                <div className="h-14 w-20 rounded-lg bg-white/10"></div>
                <div className="h-14 w-20 rounded-lg bg-white/10"></div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setModalType("followers")}
                    className="rounded-lg bg-white/10 px-4 py-2 text-center hover:bg-white/20 transition cursor-pointer"
                >
                    <p className="text-xl font-bold text-white">{stats.followers_count}</p>
                    <p className="text-xs text-white/50">被關注</p>
                </button>
                <button
                    onClick={() => setModalType("following")}
                    className="rounded-lg bg-white/10 px-4 py-2 text-center hover:bg-white/20 transition cursor-pointer"
                >
                    <p className="text-xl font-bold text-white">{stats.following_count}</p>
                    <p className="text-xs text-white/50">已關注</p>
                </button>
                <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 px-4 py-2 text-center">
                    <p className="text-xl font-bold text-amber-400">🔥 {stats.popularity_score}</p>
                    <p className="text-xs text-amber-400/70">人氣值</p>
                </div>
            </div>

            <FollowListModal
                isOpen={modalType !== null}
                onClose={() => setModalType(null)}
                userId={userId}
                type={modalType || "followers"}
                title={modalType === "followers" ? "關注者" : "已關注"}
            />
        </>
    );
}
