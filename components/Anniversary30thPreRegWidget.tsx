"use client";

import { useState, useEffect } from "react";

export function Anniversary30thPreRegWidget() {
    // 活動設定
    const TOTAL_SPOTS = 150;
    const BASE_REGISTERED = 150; // 已報名基數（額滿）
    const REG_DEADLINE = new Date("2026-03-19T23:59:59+08:00"); // 報名截止（再延期至 19 號）
    // 活動期間延期：3/19 ~ 3/26

    const COMPENSATION_SPOTS = 50; // 補償名額
    const BASE_COMPENSATION_CLAIMED = 15; // 模擬已被申請的名額，營造熱度

    const [registered, setRegistered] = useState(BASE_REGISTERED);
    const [hasRegistered, setHasRegistered] = useState(false);
    const [hasClaimedCompensation, setHasClaimedCompensation] = useState(false);
    const [compensationClaimed, setCompensationClaimed] = useState(BASE_COMPENSATION_CLAIMED);
    const [timeLeft, setTimeLeft] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    // 檢查 localStorage 是否已報名／申請補償
    useEffect(() => {
        const savedReg = localStorage.getItem("30th-prereg");
        if (savedReg === "true") {
            setHasRegistered(true);
            setRegistered(Math.min(TOTAL_SPOTS, BASE_REGISTERED + 1));
        }

        const savedComp = localStorage.getItem("30th-compensation");
        if (savedComp === "true") {
            setHasClaimedCompensation(true);
            setCompensationClaimed(Math.min(COMPENSATION_SPOTS, BASE_COMPENSATION_CLAIMED + 1));
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

    // 處理報名及申請補償
    const handleRegisterAndClaim = () => {
        if (hasClaimedCompensation || compensationClaimed >= COMPENSATION_SPOTS) return;

        setIsAnimating(true);
        // 同時報名
        if (!hasRegistered && registered < TOTAL_SPOTS) {
            setRegistered((prev) => prev + 1);
            setHasRegistered(true);
            localStorage.setItem("30th-prereg", "true");
        }

        // 申請補償
        setCompensationClaimed((prev) => prev + 1);
        setHasClaimedCompensation(true);
        localStorage.setItem("30th-compensation", "true");

        setTimeout(() => setIsAnimating(false), 600);
    };

    const progressPercent = Math.min(100, (registered / TOTAL_SPOTS) * 100);
    const spotsLeft = TOTAL_SPOTS - registered;
    const compensationSpotsLeft = COMPENSATION_SPOTS - compensationClaimed;

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
                            社群慶典再延期！搶先預約報名並領取專屬補償
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            📅 活動期間：3/19（四）~ 3/26（四）
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

                {/* 報名與補償申請按鈕 */}
                {hasClaimedCompensation ? (
                    <div className="w-full py-4 rounded-xl bg-neutral-900 border border-neutral-700 shadow-inner flex flex-col items-center justify-center gap-1">
                        <span className="text-neutral-400 font-bold text-sm tracking-wider">
                            申請已送出
                        </span>
                        <span className="text-neutral-500 text-[11px] tracking-widest">
                            是否成功，請於明日查看。
                        </span>
                    </div>
                ) : compensationSpotsLeft <= 0 ? (
                    <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-white/40 font-semibold text-sm">補償名額已滿，感謝您的支持</span>
                    </div>
                ) : (
                    <button
                        onClick={handleRegisterAndClaim}
                        className="relative w-full py-4 px-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold text-sm hover:from-sky-400 hover:to-indigo-400 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-sky-500/20 border border-sky-400/50 group overflow-hidden"
                    >
                        {/* 閃光掃過效果 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        
                        <div className="flex flex-col items-center justify-center relative z-10">
                            <span className="text-base mb-1 tracking-wide">
                                🎁 點此報名 & 申請補償（限量 {COMPENSATION_SPOTS} 名）
                            </span>
                            <span className="text-sky-100/90 text-[11px] font-medium bg-black/20 px-3 py-1 rounded-full">
                                贈：未公開的重量級神秘補償 (剩 {compensationSpotsLeft} 名)
                            </span>
                        </div>
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
