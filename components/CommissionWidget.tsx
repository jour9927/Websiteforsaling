"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Route } from "next";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function CommissionWidget() {
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ active: 0, inProgress: 0, completed: 0 });

    useEffect(() => {
        async function loadCommissions() {
            try {
                // 載入最新 3 筆刊登中的委託
                const res = await fetch("/api/commissions?status=active,queued&page=1");
                const data = await res.json();
                setCommissions((data.commissions || []).slice(0, 3));

                // 取得各狀態數量
                const [activeRes, progressRes, completedRes] = await Promise.all([
                    fetch("/api/commissions?status=active,queued&page=1"),
                    fetch("/api/commissions?status=accepted,proof_submitted,proof_approved&page=1"),
                    fetch("/api/commissions?status=completed&page=1"),
                ]);
                const [activeData, progressData, completedData] = await Promise.all([
                    activeRes.json(), progressRes.json(), completedRes.json(),
                ]);
                setStats({
                    active: activeData.total || 0,
                    inProgress: progressData.total || 0,
                    completed: completedData.total || 0,
                });
            } catch (error) {
                console.error("Load commissions error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadCommissions();
    }, []);

    if (loading) {
        return (
            <div className="glass-card p-4 animate-pulse">
                <div className="h-4 w-28 bg-white/10 rounded mb-3"></div>
                <div className="space-y-2">
                    <div className="h-10 bg-white/5 rounded"></div>
                    <div className="h-10 bg-white/5 rounded"></div>
                    <div className="h-10 bg-white/5 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden relative">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">📋 最新委託</h3>
                <Link href={"/commissions" as Route} className="text-xs text-indigo-400 hover:underline relative z-10">
                    查看更多
                </Link>
            </div>

            <div className="p-3 space-y-2">
                {commissions.map((c: any) => {
                    const posterName = c.poster?.display_name || "匿名";
                    const price = c.price_type === "twd"
                        ? `NT$${c.base_price.toLocaleString()}`
                        : `${c.base_price.toLocaleString()} pts`;
                    const fee = c.platform_fee > 0
                        ? (c.price_type === "twd" ? `NT$${c.platform_fee.toLocaleString()}` : `${c.platform_fee.toLocaleString()} pts`)
                        : null;

                    return (
                        <Link
                            key={c.id}
                            href={`/commissions/${c.id}` as Route}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition"
                        >
                            {/* 寶可夢圖示 */}
                            {c.distributions?.pokemon_sprite_url ? (
                                <img
                                    src={c.distributions.pokemon_sprite_url}
                                    alt={c.pokemon_name}
                                    className="h-8 w-8 rounded-md bg-white/5 object-contain p-0.5"
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-sm">
                                    🎴
                                </div>
                            )}

                            {/* 名稱 + 刊登者 */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{c.pokemon_name}</p>
                                <p className="text-[10px] text-white/40 truncate">{posterName}</p>
                            </div>

                            {/* 價格 + 抽成 */}
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-amber-400">{price}</p>
                                {fee && (
                                    <p className="text-[10px] glow-green font-semibold text-green-400">
                                        抽成 {fee}
                                    </p>
                                )}
                            </div>
                        </Link>
                    );
                })}
                {commissions.length === 0 && (
                    <p className="text-xs text-white/40 text-center py-2">目前沒有刊登中的委託</p>
                )}
            </div>

            {/* 統計概覽 */}
            <div className="px-3 pb-3 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-2">
                    <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-green-400">● 刊登 {stats.active}</span>
                        <span className="text-blue-400">● 進行 {stats.inProgress}</span>
                        <span className="text-white/40">● 完成 {stats.completed}</span>
                    </div>
                    <Link
                        href={"/commissions/create" as Route}
                        className="rounded-md bg-indigo-600/80 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-indigo-500 transition"
                    >
                        + 刊登
                    </Link>
                </div>
            </div>
        </div>
    );
}
