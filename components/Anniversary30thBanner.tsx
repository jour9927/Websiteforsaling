import React from 'react';
import Link from 'next/link';

export function Anniversary30thBanner({ totalBoxCount = 0 }: { totalBoxCount?: number }) {
    const goals = [
        { count: 300, reward: '全服 3000 點數' },
        { count: 1000, reward: '全服 3 張抽獎券' },
        { count: 3000, reward: '隱藏版 30 週年商店' }
    ];
    const currentTarget = goals.find(g => totalBoxCount < g.count) || goals[goals.length - 1];
    const progressPercent = Math.min(100, (totalBoxCount / currentTarget.count) * 100);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/30 via-neutral-900 to-emerald-600/30 border border-amber-500/50 p-6 mb-6 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 mb-2">
                        🎉 赤綠溯源：30 週年大慶典
                    </h2>
                    <p className="text-amber-100/80 text-sm">全服集結！達標解鎖超狂獎勵！</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/games/roulette" className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-lg hover:scale-105 transition-transform border border-rose-400/50 flex items-center justify-center gap-2 text-sm shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        <span>🎡</span> 時光輪盤抽獎
                    </Link>
                </div>
            </div>

            <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-white">全服收集進度</span>
                    <span className="text-amber-400">目前收集：{totalBoxCount.toLocaleString()} 隻</span>
                </div>
                
                <div className="w-full bg-neutral-800 rounded-full h-4 mb-2 relative overflow-hidden border border-white/5">
                    <div 
                        className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                
                <div className="flex justify-between text-xs text-white/50">
                    <span>
                        下一目標：<span className="text-amber-300 font-bold">{currentTarget.count}</span> 隻
                    </span>
                    <span>
                        解鎖：<span className="text-rose-300 font-bold">{currentTarget.reward}</span>
                    </span>
                </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500"></div>
        </div>
    );
}