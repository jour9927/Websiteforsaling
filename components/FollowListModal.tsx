"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Route } from "next";

type FollowUser = {
    id: string;
    displayName: string;
    username?: string;
    isVirtual: boolean;
};

type FollowListModalProps = {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    virtualId?: string;
    type: "followers" | "following";
    title: string;
};

export function FollowListModal({
    isOpen,
    onClose,
    userId,
    virtualId,
    type,
    title
}: FollowListModalProps) {
    const [list, setList] = useState<FollowUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        async function loadList() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (userId) params.set("userId", userId);
                if (virtualId) params.set("virtualId", virtualId);
                params.set("type", type);

                const res = await fetch(`/api/follow/list?${params}`);
                const data = await res.json();
                if (data.list) {
                    setList(data.list);
                }
            } catch (error) {
                console.error("Load follow list error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadList();
    }, [isOpen, userId, virtualId, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md mx-4 max-h-[70vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-white/60 py-8">載入中...</div>
                    ) : list.length === 0 ? (
                        <div className="text-center text-white/50 py-8">
                            {type === "followers" ? "還沒有人關注" : "還沒有關注任何人"}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {list.map((user) => {
                                const userLink = user.isVirtual
                                    ? `/user/${user.id}`
                                    : user.username
                                        ? `/user/${user.username}`
                                        : `/user/${user.id}`;

                                return (
                                    <Link
                                        key={user.id}
                                        href={userLink as Route}
                                        onClick={onClose}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition"
                                    >
                                        {/* Avatar */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                                            {user.displayName.slice(0, 2).toUpperCase()}
                                        </div>
                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {user.displayName}
                                            </p>
                                            {user.username && (
                                                <p className="text-xs text-white/50">@{user.username}</p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
