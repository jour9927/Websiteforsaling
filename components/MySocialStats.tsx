"use client";

import { useState, useEffect } from "react";
import { FollowListModal } from "./FollowListModal";
import { MaintenanceOverlay } from "./MaintenanceOverlay";

// 維護模式開關
const MAINTENANCE_MODE = true;

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
            <div className="grid grid-cols-3 gap-4 animate-pulse">
                <div className="h-20 rounded-xl bg-white/5"></div>
                <div className="h-20 rounded-xl bg-white/5"></div>
                <div className="h-20 rounded-xl bg-white/5"></div>
            </div>
        );
    }

    return (
        <>
            <div className="relative overflow-hidden rounded-xl">
                {/* 維護遮罩 */}
                {MAINTENANCE_MODE && (
                    <div className="absolute inset-0 z-10">
                        <MaintenanceOverlay
                            title="維護中"
                            message="社交數據暫時不予開放"
                        />
                    </div>
                )}
                <div className={MAINTENANCE_MODE ? "blur-sm pointer-events-none select-none" : ""}>
                    <div className="grid grid-cols-3 gap-4">
                        {/* 被關注 */}
                        <button
                            onClick={() => setModalType("followers")}
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-4 text-center transition hover:from-blue-500/30 hover:to-cyan-500/20 hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                            <p className="text-2xl font-bold text-white">{stats.followers_count}</p>
                            <p className="text-xs text-white/60 mt-1">被關注</p>
                        </button>

                        {/* 已關注 */}
                        <button
                            onClick={() => setModalType("following")}
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-4 text-center transition hover:from-purple-500/30 hover:to-pink-500/20 hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                            <p className="text-2xl font-bold text-white">{stats.following_count}</p>
                            <p className="text-xs text-white/60 mt-1">已關注</p>
                        </button>

                        {/* 人氣值 */}
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-4 text-center">
                            <div className="absolute top-2 right-2 text-2xl opacity-20">🔥</div>
                            <p className="text-2xl font-bold text-amber-400">{stats.popularity_score}</p>
                            <p className="text-xs text-amber-400/60 mt-1">人氣值</p>
                        </div>
                    </div>
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


