"use client";

import { useState, useEffect } from "react";

export function Anniversary30thPreRegWidget() {
    // 活動設定
    const TOTAL_SPOTS = 150;
    const BASE_REGISTERED = 150; // 已報名基數（額滿）
    const REG_DEADLINE = new Date("2026-03-14T23:59:59+08:00"); // 報名截止
    // 活動期間：3/15 ~ 3/22

    const [registered, setRegistered] = useState(BASE_REGISTERED);
    const [hasRegistered, setHasRegistered] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    // 檢查 localStorage 是否已報名
    useEffect(() => {
        const saved = localStorage.getItem("30th-prereg");
        if (saved === "true") {
            setHasRegistered(true);
            setRegistered(Math.min(TOTAL_SPOTS, BASE_REGISTERED + 1));
        }
    }, []);

    // 倒計時
    useEffect(() => {
        function updateCountdown() {
            const now = new Date();
            const diff = REG_DEADLINE.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("已截止");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${days}天 ${hours}時 ${minutes}分 ${seconds}秒`);
        }

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRegister = () => {
        if (hasRegistered || registered >= TOTAL_SPOTS) return;

        setIsAnimating(true);
        setRegistered((prev) => prev + 1);
        setHasRegistered(true);
        localStorage.setItem("30th-prereg", "true");

        setTimeout(() => setIsAnimating(false), 600);
    };

    const progressPercent = Math.min(100, (registered / TOTAL_SPOTS) * 100);
    const spotsLeft = TOTAL_SPOTS - registered;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 via-neutral-900 to-emerald-600/20 border border-amber-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            {/* 頂部金色漸層線 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />

            {/* 裝飾背景 */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-amber-500/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative p-6">
                {/* 標題區 */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-medium text-green-400 uppercase tracking-wider">預先報名中</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                            🎊 寶可夢 30 週年系列活動
                        </h2>
                        <p className="mt-1 text-sm text-white/60">
                            社群慶典即將開跑！搶先預約報名，名額有限
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            📅 活動期間：3/15（六）~ 3/22（日）
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-xs text-white/40 mb-1">報名截止倒數</p>
                        <p className="text-base font-mono font-bold text-amber-400 tabular-nums">
                            {timeLeft}
                        </p>
                    </div>
                </div>

                {/* 進度條區 */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/10 mb-4">
                    <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-white/80">報名進度</span>
                        <span className="text-amber-400">
                            <span className={`inline-block transition-all duration-300 ${isAnimating ? "scale-125 text-green-400" : ""}`}>
                                {registered}
                            </span>
                            {" "}/{" "}{TOTAL_SPOTS} 位
                        </span>
                    </div>

                    <div className="w-full bg-neutral-800 rounded-full h-4 relative overflow-hidden border border-white/5">
                        <div
                            className="h-4 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                            style={{
                                width: `${progressPercent}%`,
                                background: progressPercent >= 90
                                    ? "linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)"
                                    : "linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)",
                            }}
                        >
                            {/* 閃光動畫 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>

                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-white/40">
                            {progressPercent >= 90 ? "🔥 即將額滿！" : "📢 持續招募中"}
                        </span>
                        <span className="text-xs text-rose-300 font-medium">
                            剩餘 {spotsLeft} 個名額
                        </span>
                    </div>
                </div>

                {/* 活動亮點 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-lg bg-white/5 p-2.5 text-center border border-white/5">
                        <p className="text-lg">🎁</p>
                        <p className="text-[10px] text-white/50 mt-1">限定配布</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5 text-center border border-white/5">
                        <p className="text-lg">🏆</p>
                        <p className="text-[10px] text-white/50 mt-1">積分競賽</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5 text-center border border-white/5">
                        <p className="text-lg">✨</p>
                        <p className="text-[10px] text-white/50 mt-1">色違抽獎</p>
                    </div>
                </div>

                {/* 報名按鈕 */}
                {hasRegistered ? (
                    <div className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
                        <span className="text-green-400 font-semibold text-sm flex items-center justify-center gap-2">
                            ✅ 已成功報名！活動開跑時將通知你
                        </span>
                    </div>
                ) : spotsLeft <= 0 ? (
                    <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-white/40 font-semibold text-sm">已額滿</span>
                    </div>
                ) : (
                    <button
                        onClick={handleRegister}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 border border-amber-400/50"
                    >
                        🎉 立即報名（免費）
                    </button>
                )}
            </div>

            {/* shimmer 動畫 */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
