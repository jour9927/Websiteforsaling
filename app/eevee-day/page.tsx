"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";
import { EEVEE_DAY_CONFIG } from "@/lib/eevee-day-questions";

type Distribution = {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string;
    pokemon_sprite_url?: string;
    is_shiny?: boolean;
    generation?: number;
    event_name?: string;
    original_trainer?: string;
};

type EventStatus = {
    isActive: boolean;
    hasEnded: boolean;
    startDate: string;
    endDate: string;
    stamps: number;
    stampsRequired: number;
    attemptsToday: number;
    dailyAttempts: number;
    remainingAttempts: number;
    hasRetakeTicket?: boolean;
    isLastDay?: boolean;
    reward: {
        id: string;
        distribution_id: string;
        selected_at: string;
        distributions: Distribution;
    } | null;
    availableDistributions: Distribution[];
};

export default function EeveeDayPage() {
    const [status, setStatus] = useState<EventStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [selectingReward, setSelectingReward] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [claimedCount, setClaimedCount] = useState(0);
    const [totalRewards] = useState(500); // 假設總共有 500 份獎勵

    useEffect(() => {
        // 為了避免重整後數字變小，我們使用 localStorage 來記住使用者的最高數字
        // 基礎數字設定在 412 (約 82.4%)
        const base = 412;
        const randomOffset = Math.floor(Math.random() * 8); // 0 ~ 7
        const newCount = Math.min(base + randomOffset, totalRewards);
        
        // 嘗試從 localStorage 讀取之前的數字
        const savedCountStr = localStorage.getItem('eevee_day_claimed_count');
        const savedCount = savedCountStr ? parseInt(savedCountStr, 10) : 0;
        
        // 確保數字只會增加，不會減少
        const finalCount = Math.max(newCount, savedCount);
        
        // 如果新數字比舊數字大，或者還沒存過，就存起來
        if (finalCount > savedCount) {
            localStorage.setItem('eevee_day_claimed_count', finalCount.toString());
        }
        
        setClaimedCount(finalCount);
    }, [totalRewards]);

    const loadStatus = async () => {
        try {
            const res = await fetch("/api/eevee-day/status");
            if (res.status === 401) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error("Load status error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleSelectReward = async (distributionId: string) => {
        if (selectingReward) return;
        setSelectingReward(true);
        setMessage(null);

        try {
            const res = await fetch("/api/eevee-day/reward", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ distributionId }),
            });
            const data = await res.json();

            if (data.success) {
                setMessage(data.message);
                loadStatus();
            } else {
                setMessage(data.error);
            }
        } catch {
            setMessage("選擇失敗，請稍後再試");
        } finally {
            setSelectingReward(false);
        }
    };

    if (loading) {
        return (
            <section className="glass-card p-8 text-center">
                <div className="animate-pulse text-white/60">載入中...</div>
            </section>
        );
    }

    if (!isLoggedIn) {
        return (
            <section className="space-y-6">
                <EventBanner />
                <MemberOnlyBlock
                    title="會員專屬活動"
                    description="登入後即可參與伊步集點日活動"
                    itemCount={3}
                />
            </section>
        );
    }

    if (!status) return null;

    const canPlay = status.isActive && status.remainingAttempts > 0;
    const canSelectReward = status.stamps >= status.stampsRequired && !status.reward;

    return (
        <section className="space-y-6">
            {/* 活動 Banner */}
            <EventBanner />

            {/* 假領取人數統計 (進度條版本) */}
            {claimedCount > 0 && (
                <div className="glass-card p-4 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/10 to-amber-500/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg animate-bounce">🔥</span>
                            <p className="text-sm font-medium text-amber-200/90">
                                獎勵兌換進度
                            </p>
                        </div>
                        <p className="text-xs text-white/60">
                            已領取 <span className="text-amber-400 font-bold text-sm">{claimedCount}</span> / {totalRewards}
                        </p>
                    </div>
                    
                    {/* 進度條外框 */}
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                        {/* 進度條本體 */}
                        <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 relative transition-all duration-1000 ease-out"
                            style={{ width: `${(claimedCount / totalRewards) * 100}%` }}
                        >
                            {/* 進度條上的光澤動畫 */}
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                    <p className="text-[10px] text-white/40 mt-2 text-right">
                        * 獎勵數量有限，換完為止
                    </p>
                </div>
            )}

            {/* 活動狀態 */}
            {!status.isActive && !status.hasEnded && (
                <div className="glass-card p-4 text-center border border-blue-500/30">
                    <p className="text-white/70">🕐 活動將於 <span className="text-blue-400 font-bold">{status.startDate.slice(0, 10)}</span> 開始</p>
                </div>
            )}
            {status.hasEnded && (
                <div className="glass-card p-4 text-center border border-white/20">
                    <p className="text-white/50">🏁 活動已結束</p>
                </div>
            )}

            {/* 集點卡 */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white/90">🎯 集點進度</h2>
                    <span className="text-sm text-amber-400 font-bold">
                        {status.stamps} / {status.stampsRequired}
                    </span>
                </div>

                {/* 集點格子 */}
                <div className="flex gap-3 justify-center mb-4">
                    {Array.from({ length: status.stampsRequired }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${i < status.stamps
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 scale-105"
                                : "bg-white/10 border border-white/20"
                                }`}
                        >
                            {i < status.stamps ? "⭐" : <span className="text-white/20 text-lg">{i + 1}</span>}
                        </div>
                    ))}
                </div>

                {status.stamps >= status.stampsRequired ? (
                    <p className="text-center text-sm text-emerald-400 font-medium">
                        ✅ 已集滿！{status.reward ? "獎勵已領取" : "可以選擇獎勵了"}
                    </p>
                ) : (
                    <p className="text-center text-xs text-white/50">
                        還差 {status.stampsRequired - status.stamps} 點
                    </p>
                )}
            </div>

            {/* 今日嘗試 & 開始答題 */}
            {status.isActive && (
                <div className="glass-card p-6">
                    {/* 🎫 VIP補考券提示 */}
                    {status.hasRetakeTicket && (
                        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30">
                            <p className="text-sm text-amber-300 font-bold flex items-center gap-2">
                                🎫 VIP 補考券已發放
                            </p>
                            <p className="text-xs text-amber-200/70 mt-1">
                                因為你的努力，今天可以答題 <span className="font-bold text-amber-300">2 次</span>！把握最後機會集滿獎勵！
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white/80">📝 寶可夢常識問答</h3>
                            <p className="text-xs text-white/50 mt-1">
                                答對 {EEVEE_DAY_CONFIG.passingScore}/{EEVEE_DAY_CONFIG.questionsPerQuiz} 題即可集 1 點
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/50">今日剩餘</p>
                            <p className={`text-lg font-bold ${status.remainingAttempts > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {status.remainingAttempts} 次
                            </p>
                        </div>
                    </div>

                    {canPlay ? (
                        <Link
                            href="/eevee-day/quiz"
                            className="block w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-center font-bold text-lg hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-amber-500/30"
                        >
                            🎮 開始答題
                        </Link>
                    ) : (
                        <div className="w-full py-3 rounded-xl bg-white/10 text-white/40 text-center font-medium">
                            今日次數已用完，明天再來！
                        </div>
                    )}
                </div>
            )}

            {/* 獎勵選擇 */}
            {canSelectReward && (
                <div className="glass-card p-6 border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent">
                    <h2 className="text-lg font-bold text-amber-400 mb-2">🎁 選擇你的獎勵</h2>
                    <p className="text-xs text-white/50 mb-4">
                        ⚠️ 獎勵只能選擇一次，選定後無法更改（如需更改請私訊管理員）
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {status.availableDistributions.map((dist) => (
                            <button
                                key={dist.id}
                                onClick={() => handleSelectReward(dist.id)}
                                disabled={selectingReward}
                                className="glass-card p-4 text-center hover:bg-white/10 hover:scale-105 transition border border-white/10 hover:border-amber-500/50 disabled:opacity-50"
                            >
                                {dist.pokemon_sprite_url && (
                                    <Image
                                        src={dist.pokemon_sprite_url}
                                        alt={dist.pokemon_name}
                                        width={80}
                                        height={80}
                                        className="pixelated mx-auto mb-2"
                                    />
                                )}
                                <p className="text-sm font-bold text-white">
                                    {dist.pokemon_name}
                                    {dist.is_shiny && " ✨"}
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5">
                                    {dist.event_name || `第 ${dist.generation} 世代`}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 已選獎勵展示 */}
            {status.reward && (
                <div className="glass-card p-6 border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent">
                    <h2 className="text-lg font-bold text-emerald-400 mb-3">🏆 你的獎勵</h2>
                    <div className="flex items-center gap-4">
                        {status.reward.distributions?.pokemon_sprite_url && (
                            <Image
                                src={status.reward.distributions.pokemon_sprite_url}
                                alt={status.reward.distributions.pokemon_name}
                                width={80}
                                height={80}
                                className="pixelated"
                            />
                        )}
                        <div>
                            <p className="text-lg font-bold text-white">
                                {status.reward.distributions?.pokemon_name}
                                {status.reward.distributions?.is_shiny && " ✨"}
                            </p>
                            <p className="text-xs text-white/50">
                                {status.reward.distributions?.event_name || "配布寶可夢"}
                            </p>
                            <p className="text-[10px] text-white/40 mt-1">
                                已加入你的配布圖鑑
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 通知訊息 */}
            {message && (
                <div className={`glass-card p-4 text-center text-sm ${message.includes("恭喜") || message.includes("成功")
                    ? "text-emerald-400 border border-emerald-500/30"
                    : "text-red-400 border border-red-500/30"
                    }`}>
                    {message}
                </div>
            )}

            {/* 活動規則 */}
            <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-white/80 mb-2">📌 活動規則</h3>
                <ul className="space-y-1 text-xs text-white/60">
                    <li>• 活動期間：{EEVEE_DAY_CONFIG.startDate.slice(0, 10)} ~ {EEVEE_DAY_CONFIG.endDate.slice(0, 10)}</li>
                    <li>• 每日可嘗試 <span className="text-amber-400">{EEVEE_DAY_CONFIG.dailyAttempts}</span> 次答題</li>
                    <li>• 每次 {EEVEE_DAY_CONFIG.questionsPerQuiz} 題，每題限時 {EEVEE_DAY_CONFIG.timePerQuestion} 秒</li>
                    <li>• 答對 <span className="text-amber-400">{EEVEE_DAY_CONFIG.passingScore}</span> 題以上即可集 1 點</li>
                    <li>• 集滿 <span className="text-amber-400">{EEVEE_DAY_CONFIG.stampsRequired}</span> 點可選擇一隻配布寶可夢獎勵</li>
                    <li>• 可選：伊布、蒂安希、比克提尼</li>
                    <li>• ⚠️ 獎勵選定後<span className="text-red-400">無法更改</span>，如需更改請私訊管理員</li>
                </ul>
            </div>
        </section>
    );
}

// 活動 Banner
function EventBanner() {
    return (
        <div className="glass-card overflow-hidden border border-amber-500/30">
            <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-purple-500/20">
                <div className="absolute top-2 right-3 text-4xl opacity-20 select-none">🌟</div>
                <div className="flex items-center gap-4">
                    <Image
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png"
                        alt="伊布"
                        width={72}
                        height={72}
                        className="drop-shadow-lg"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                            伊步集點日
                        </h1>
                        <p className="text-sm text-white/60 mt-0.5">
                            限時集點活動 — 答題集點，獲得珍貴配布！
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                            📅 {EEVEE_DAY_CONFIG.startDate.slice(0, 10)} ~ {EEVEE_DAY_CONFIG.endDate.slice(0, 10)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
