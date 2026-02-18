"use client";

import Link from "next/link";

// 春節活動期間
const FESTIVAL_START = new Date("2026-02-16T00:00:00+08:00");
const FESTIVAL_END = new Date("2026-03-01T00:00:00+08:00"); // 2/29 結束 = 3/1 00:00

// Day 2 競標寶可夢 GIF (PokeAPI animated sprites)
const DAY2_POKEMON = [
    { name: "波加曼", nameEn: "Piplup", dexNumber: 393 },
    { name: "木木梟", nameEn: "Rowlet", dexNumber: 722 },
    { name: "卡蒂狗", nameEn: "Growlithe", dexNumber: 58 },
    { name: "夢夢蝕", nameEn: "Munna", dexNumber: 517 },
    { name: "泡沫蛙", nameEn: "Froakie", dexNumber: 656 },
];

// 每日寶可夢配置（可以擴展）
const DAILY_POKEMON: Record<number, typeof DAY2_POKEMON> = {
    2: DAY2_POKEMON,
    // 未來可以加更多天的配置
};

function getSprite(dexNumber: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
}

function getAnimatedSprite(dexNumber: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${dexNumber}.gif`;
}

export function SpringFestivalBanner() {
    const now = new Date();

    // 計算當前 Day 數 (台灣時間)
    const nowTW = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const startTW = new Date(FESTIVAL_START.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));

    const diffDays = Math.floor((nowTW.getTime() - startTW.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = diffDays + 1; // Day 1 starts on 2/16

    // 活動未開始或已結束 → 不顯示
    if (now < FESTIVAL_START || now >= FESTIVAL_END) return null;

    // 取得今日寶可夢（如果有配置的話使用配置，沒有則使用 Day 2 作為備用）
    const todayPokemon = DAILY_POKEMON[currentDay] || DAY2_POKEMON;

    return (
        <Link href="/auctions" className="block group">
            <div className="relative overflow-hidden rounded-2xl border border-red-500/30 hover:border-red-400/50 transition-all duration-500">
                {/* 背景圖片 */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/spring-festival-banner.png')" }}
                />
                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-red-900/60 to-amber-900/70" />

                {/* 動態光暈效果 */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-400/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />

                {/* 內容 */}
                <div className="relative z-10 p-5 sm:p-6">
                    {/* 頂部：標題 + DAY 標籤 */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-amber-200 flex items-center gap-2">
                                <span className="text-2xl">🧧</span>
                                春節特別活動
                            </h3>
                            <p className="text-xs sm:text-sm text-amber-100/70 mt-1">
                                2026/2/16 ~ 2/29
                            </p>
                        </div>

                        {/* Day 標籤 */}
                        <div className="flex flex-col items-center bg-red-600/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-amber-400/30 shadow-lg shadow-red-900/30">
                            <span className="text-[10px] text-amber-200/80 font-medium tracking-widest uppercase">Day</span>
                            <span className="text-2xl sm:text-3xl font-black text-amber-300 leading-none">{currentDay}</span>
                        </div>
                    </div>

                    {/* 今日競標寶可夢 */}
                    <div className="mt-2">
                        <p className="text-[11px] text-amber-200/60 mb-2 tracking-wider">
                            🎯 今日競標寶可夢
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-1">
                            {todayPokemon.map((pokemon) => (
                                <div
                                    key={pokemon.dexNumber}
                                    className="flex-shrink-0 flex flex-col items-center gap-1 group/pokemon"
                                >
                                    {/* 寶可夢圖片容器 */}
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-amber-400/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/pokemon:scale-110 group-hover/pokemon:border-amber-400/50 group-hover/pokemon:bg-white/20">
                                        {/* GIF 動畫 */}
                                        <img
                                            src={getAnimatedSprite(pokemon.dexNumber)}
                                            alt={pokemon.name}
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg"
                                            onError={(e) => {
                                                // 備用：靜態圖片
                                                (e.target as HTMLImageElement).src = getSprite(pokemon.dexNumber);
                                            }}
                                        />
                                        {/* 閃光效果 */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover/pokemon:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    {/* 名稱 */}
                                    <span className="text-[10px] text-amber-100/70 font-medium whitespace-nowrap">
                                        {pokemon.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hover 提示 */}
                    <div className="absolute bottom-2 right-3 text-[10px] text-amber-200/40 group-hover:text-amber-200/80 transition-colors duration-300">
                        前往競標 →
                    </div>
                </div>

                {/* 底部金色邊線 */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            </div>
        </Link>
    );
}
