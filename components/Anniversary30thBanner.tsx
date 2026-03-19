import React from 'react';
import Link from 'next/link';

export function Anniversary30thBanner() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-slate-900/90 border border-purple-500/50 p-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
                <div className="text-center md:text-left flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80 font-bold">Event Glass 30th Anniversary</p>
                    <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-200 to-pink-300">
                        🎉 30 週年寶可夢對決祭典
                    </h2>
                    <p className="text-purple-100/80 text-sm leading-relaxed max-w-lg mx-auto md:mx-0">
                        選擇你的專屬夥伴寶可夢，展開為期 7 天的並肩作戰！每日 3 場對付隨機強敵，透過「骰子、答題、拉霸」等關卡累積勝場。連勝或達標即可將「伴侶寶可夢」及「隱藏相遇權」帶回家！
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/anniversary-30th" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-transform border border-pink-400/50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                        <span>⚔️</span> 立即參戰
                    </Link>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-500"></div>
            
            {/* Decorative background circles */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
        </div>
    );
}