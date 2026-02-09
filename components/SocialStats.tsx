"use client";

import { useState, useEffect, useCallback } from "react";
import { FollowListModal } from "./FollowListModal";

type SocialStatsProps = {
    userId?: string;
    virtualId?: string;
    isOwnProfile?: boolean;
    initialFollowers?: number;
    initialPopularity?: number;
};

export function SocialStats({
    userId,
    virtualId,
    isOwnProfile = false,
    initialFollowers = 0,
    initialPopularity = 0
}: SocialStatsProps) {
    const [stats, setStats] = useState({
        followers_count: initialFollowers,
        following_count: 0,
        popularity_score: initialPopularity,
        isFollowing: false,
        isLoggedIn: false
    });
    const [voteStatus, setVoteStatus] = useState({
        hasVotedThisWeek: false,
        remainingQuota: 4
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Modal 狀態
    const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

    const loadData = useCallback(async () => {
        try {
            const params = userId ? `userId=${userId}` : `virtualId=${virtualId}`;

            // 載入關注狀態
            const followRes = await fetch(`/api/follow?${params}`);
            const followData = await followRes.json();

            setStats({
                followers_count: followData.followers_count || initialFollowers,
                following_count: followData.following_count || 0,
                popularity_score: followData.popularity_score || initialPopularity,
                isFollowing: followData.isFollowing || false,
                isLoggedIn: followData.isLoggedIn || false
            });

            // 載入投票狀態
            if (followData.isLoggedIn) {
                const voteRes = await fetch(`/api/popularity?action=status&${params}`);
                const voteData = await voteRes.json();
                setVoteStatus({
                    hasVotedThisWeek: voteData.hasVotedThisWeek || false,
                    remainingQuota: voteData.remainingQuota ?? 4
                });
            }
        } catch (error) {
            console.error("Load social stats error:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, virtualId, initialFollowers, initialPopularity]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFollow = async () => {
        if (!stats.isLoggedIn) {
            setMessage("請先登入");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch("/api/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    virtualId,
                    action: stats.isFollowing ? "unfollow" : "follow"
                })
            });

            const data = await res.json();
            if (data.success) {
                setStats(prev => ({
                    ...prev,
                    isFollowing: data.action === "followed",
                    followers_count: prev.followers_count + (data.action === "followed" ? 1 : -1)
                }));
                setMessage(data.action === "followed" ? "已關注！" : "已取消關注");
            } else {
                setMessage(data.error);
            }
        } catch {
            setMessage("操作失敗");
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(null), 2000);
        }
    };

    const handleVote = async () => {
        if (!stats.isLoggedIn) {
            setMessage("請先登入");
            return;
        }

        if (voteStatus.hasVotedThisWeek) {
            setMessage("本週已投過票");
            return;
        }

        if (voteStatus.remainingQuota <= 0) {
            setMessage("本月額度已用完");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch("/api/popularity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, virtualId })
            });

            const data = await res.json();
            if (data.success) {
                setStats(prev => ({
                    ...prev,
                    popularity_score: prev.popularity_score + 1
                }));
                setVoteStatus(prev => ({
                    hasVotedThisWeek: true,
                    remainingQuota: prev.remainingQuota - 1
                }));
                setMessage(`人氣 +1！剩餘 ${data.remainingQuota} 次`);
            } else {
                setMessage(data.error);
            }
        } catch {
            setMessage("投票失敗");
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex gap-4 animate-pulse">
                <div className="h-8 w-20 rounded bg-white/10"></div>
                <div className="h-8 w-20 rounded bg-white/10"></div>
                <div className="h-8 w-20 rounded bg-white/10"></div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* 統計數字 - 可點擊 */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setModalType("followers")}
                        className="rounded-lg bg-white/10 px-3 py-2 text-center hover:bg-white/20 transition cursor-pointer"
                    >
                        <p className="text-lg font-bold text-white">{stats.followers_count}</p>
                        <p className="text-xs text-white/50">被關注</p>
                    </button>
                    {!virtualId && (
                        <button
                            onClick={() => setModalType("following")}
                            className="rounded-lg bg-white/10 px-3 py-2 text-center hover:bg-white/20 transition cursor-pointer"
                        >
                            <p className="text-lg font-bold text-white">{stats.following_count}</p>
                            <p className="text-xs text-white/50">已關注</p>
                        </button>
                    )}
                    <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 px-3 py-2 text-center">
                        <p className="text-lg font-bold text-amber-400">🔥 {stats.popularity_score}</p>
                        <p className="text-xs text-amber-400/70">人氣值</p>
                    </div>
                </div>

                {/* 操作按鈕（非自己的頁面才顯示） */}
                {!isOwnProfile && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleFollow}
                            disabled={actionLoading || !stats.isLoggedIn}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${stats.isFollowing
                                ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                                } disabled:opacity-50`}
                        >
                            {actionLoading ? "..." : stats.isFollowing ? "取消關注" : "+ 關注"}
                        </button>

                        <button
                            onClick={handleVote}
                            disabled={actionLoading || !stats.isLoggedIn || voteStatus.hasVotedThisWeek || voteStatus.remainingQuota <= 0}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${voteStatus.hasVotedThisWeek
                                ? "bg-white/5 text-white/40 cursor-not-allowed"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90"
                                } disabled:opacity-50`}
                            title={`每週可給同一人投 1 次，本月剩餘 ${voteStatus.remainingQuota} 次`}
                        >
                            {voteStatus.hasVotedThisWeek ? "本週已投票" : "🔥 +1 人氣"}
                        </button>
                    </div>
                )}

                {/* 投票說明 */}
                {!isOwnProfile && stats.isLoggedIn && (
                    <p className="text-xs text-white/40">
                        💡 每週可給同一人投 1 次，每月共 4 次額度（剩餘 {voteStatus.remainingQuota} 次）
                    </p>
                )}

                {/* 訊息提示 */}
                {message && (
                    <p className={`text-sm ${message.includes("失敗") || message.includes("登入") ? "text-red-400" : "text-emerald-400"}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* 關注列表 Modal */}
            <FollowListModal
                isOpen={modalType !== null}
                onClose={() => setModalType(null)}
                userId={userId}
                virtualId={virtualId}
                type={modalType || "followers"}
                title={modalType === "followers" ? "關注者" : "已關注"}
            />
        </>
    );
}

