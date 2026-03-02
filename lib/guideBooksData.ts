// 書本式配布圖鑑資料定義
// 每個世代 3 本書，按配布點數高低分為：SSR（稀有）、SR（高級）、R（普遍）

export type BookTier = "rare" | "premium" | "common";

export interface GuideBook {
    id: string;
    title: string;
    subtitle: string;
    generation: number;
    tier: BookTier;
    description: string;
    coverImage: string;
    themeGradient: string;
    themeColor: string;
    accentColor: string;
}

// 稀有度分級標題
export const tierLabels: Record<BookTier, string> = {
    rare: "SSR",
    premium: "SR",
    common: "R",
};

export const tierSubtitles: Record<BookTier, string> = {
    rare: "稀有",
    premium: "高級",
    common: "普遍",
};

export const tierEmojis: Record<BookTier, string> = {
    rare: "💎",
    premium: "⭐",
    common: "📘",
};

// 根據同世代配布的 points 排序後，前 1/3 SSR、中 1/3 SR、後 1/3 R
export function classifyDistributionsByTier<
    T extends { points?: number | null },
>(distributions: T[]): Record<BookTier, T[]> {
    // 按 points 降序排列
    const sorted = [...distributions].sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0)
    );

    const total = sorted.length;
    const rareEnd = Math.ceil(total / 3);
    const premiumEnd = Math.ceil((total * 2) / 3);

    return {
        rare: sorted.slice(0, rareEnd),
        premium: sorted.slice(rareEnd, premiumEnd),
        common: sorted.slice(premiumEnd),
    };
}

export const guideBooks: GuideBook[] = [
    // ── 第一世代 (赤綠 30 週年紀念) ──
    {
        id: "gen1-rare",
        title: "赤綠30週年・SSR",
        subtitle: "關都赤綠最珍貴的傳說",
        generation: 1,
        tier: "rare",
        description:
            "1996 赤綠 30 週年紀念特別版圖鑑！收錄關都地區點數最高的頂級配布寶可夢。超夢、夢幻等傳說級配布，每一隻都是無價的珍藏。",
        coverImage: "/guides/gen1_legendary.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen1-premium",
        title: "赤綠30週年・SR",
        subtitle: "關都赤綠的優質回憶",
        generation: 1,
        tier: "premium",
        description:
            "赤綠 30 週年紀念！中等稀有度的關都配布紀錄。重溫1996年初代發售時的熱血與感動。",
        coverImage: "/guides/gen1_classic.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen1-common",
        title: "赤綠30週年・R",
        subtitle: "關都赤綠的啟程足跡",
        generation: 1,
        tier: "common",
        description:
            "赤綠 30 週年紀念！關都地區基礎配布紀錄。致敬夢想開始的真新鎮，是每位訓練家旅程的基石。",
        coverImage: "/guides/gen1_classic.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第二世代 ──
    {
        id: "gen2-rare",
        title: "第2世代・SSR",
        subtitle: "城都地區最珍貴的配布",
        generation: 2,
        tier: "rare",
        description:
            "鳳王與洛奇亞翱翔天際，雪拉比穿越時空——城都地區最珍貴的稀有配布大全。",
        coverImage: "/guides/gen2_chronicle.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen2-premium",
        title: "第2世代・SR",
        subtitle: "城都地區的優質收藏",
        generation: 2,
        tier: "premium",
        description:
            "城都地區的中等稀有配布紀錄，金銀時代的獨特回憶。",
        coverImage: "/guides/gen2_secret.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen2-common",
        title: "第2世代・R",
        subtitle: "城都地區的基礎配布",
        generation: 2,
        tier: "common",
        description:
            "城都地區的基礎配布合集，每位訓練家的共同回憶。",
        coverImage: "/guides/gen2_secret.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第三世代 ──
    {
        id: "gen3-rare",
        title: "第3世代・SSR",
        subtitle: "豐緣地區最珍貴的配布",
        generation: 3,
        tier: "rare",
        description:
            "固拉多、蓋歐卡、烈空坐——豐緣三神獸與最古老的 GBA 時代稀有配布。距今 20 年的傳說。",
        coverImage: "/guides/gen3_hoenn.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen3-premium",
        title: "第3世代・SR",
        subtitle: "豐緣地區的優質收藏",
        generation: 3,
        tier: "premium",
        description:
            "基拉祈、代歐奇希斯等神話級幻之寶可夢的高級配布紀錄。",
        coverImage: "/guides/gen3_myth.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen3-common",
        title: "第3世代・R",
        subtitle: "豐緣地區的基礎配布",
        generation: 3,
        tier: "common",
        description:
            "豐緣地區的基礎配布合集，GBA 時代的純粹冒險。",
        coverImage: "/guides/gen3_myth.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第四世代 ──
    {
        id: "gen4-rare",
        title: "第4世代・SSR",
        subtitle: "神奧地區最珍貴的配布",
        generation: 4,
        tier: "rare",
        description:
            "阿爾宙斯、帝牙盧卡、帕路奇亞——創世神話的稀有配布收藏。",
        coverImage: "/guides/gen4_creation.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen4-premium",
        title: "第4世代・SR",
        subtitle: "神奧地區的優質收藏",
        generation: 4,
        tier: "premium",
        description:
            "騎拉帝納的反轉世界與時空裂隙的高級配布紀錄。",
        coverImage: "/guides/gen4_rift.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen4-common",
        title: "第4世代・R",
        subtitle: "神奧地區的基礎配布",
        generation: 4,
        tier: "common",
        description:
            "神奧地區的基礎配布合集，DS 時代的經典記憶。",
        coverImage: "/guides/gen4_sinnoh.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第五世代 ──
    {
        id: "gen5-rare",
        title: "第5世代・SSR",
        subtitle: "合眾地區最珍貴的配布",
        generation: 5,
        tier: "rare",
        description:
            "萊希拉姆、捷克羅姆與酋雷姆——黑白之戰的稀有配布大全。",
        coverImage: "/guides/gen5_unova.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen5-premium",
        title: "第5世代・SR",
        subtitle: "合眾地區的優質收藏",
        generation: 5,
        tier: "premium",
        description:
            "合眾地區的中等稀有配布紀錄，真實與理想的交會。",
        coverImage: "/guides/gen5_awakening.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen5-common",
        title: "第5世代・R",
        subtitle: "合眾地區的基礎配布",
        generation: 5,
        tier: "common",
        description:
            "合眾地區的基礎配布合集，BW 時代的冒險記憶。",
        coverImage: "/guides/gen5_awakening.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第六世代 ──
    {
        id: "gen6-rare",
        title: "第6世代・SSR",
        subtitle: "卡洛斯地區最珍貴的配布",
        generation: 6,
        tier: "rare",
        description:
            "哲爾尼亞斯與伊裴爾塔爾的稀有配布。3DS 時代最珍貴的收藏。",
        coverImage: "/guides/gen6_kalos.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen6-premium",
        title: "第6世代・SR",
        subtitle: "卡洛斯地區的優質收藏",
        generation: 6,
        tier: "premium",
        description:
            "MEGA 進化時代的高級配布紀錄，突破極限的力量。",
        coverImage: "/guides/gen6_mega.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen6-common",
        title: "第6世代・R",
        subtitle: "卡洛斯地區的基礎配布",
        generation: 6,
        tier: "common",
        description:
            "卡洛斯地區的基礎配布合集，XY 時代的優雅記憶。",
        coverImage: "/guides/gen6_mega.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第七世代 ──
    {
        id: "gen7-rare",
        title: "第7世代・SSR",
        subtitle: "阿羅拉地區最珍貴的配布",
        generation: 7,
        tier: "rare",
        description:
            "索爾迦雷歐、露奈雅拉與究極異獸——阿羅拉群島最珍貴的稀有配布。",
        coverImage: "/guides/gen7_alola.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen7-premium",
        title: "第7世代・SR",
        subtitle: "阿羅拉地區的優質收藏",
        generation: 7,
        tier: "premium",
        description:
            "究極之洞的高級配布紀錄，來自異次元的珍貴訪客。",
        coverImage: "/guides/gen7_ultra.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen7-common",
        title: "第7世代・R",
        subtitle: "阿羅拉地區的基礎配布",
        generation: 7,
        tier: "common",
        description:
            "阿羅拉地區的基礎配布合集，熱帶島嶼的純粹回憶。",
        coverImage: "/guides/gen7_ultra.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第八世代 ──
    {
        id: "gen8-rare",
        title: "第8世代・SSR",
        subtitle: "伽勒爾地區最珍貴的配布",
        generation: 8,
        tier: "rare",
        description:
            "蒼響、藏瑪然特與無極汰那——伽勒爾騎士傳說的稀有配布。",
        coverImage: "/guides/gen8_galar.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen8-premium",
        title: "第8世代・SR",
        subtitle: "伽勒爾地區的優質收藏",
        generation: 8,
        tier: "premium",
        description:
            "極巨化時代的高級配布紀錄，劍盾的珍貴記憶。",
        coverImage: "/guides/gen8_dynamax.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen8-common",
        title: "第8世代・R",
        subtitle: "伽勒爾地區的基礎配布",
        generation: 8,
        tier: "common",
        description:
            "伽勒爾地區的基礎配布合集，Wi-Fi 大量配布時代。",
        coverImage: "/guides/gen8_dynamax.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第九世代 ──
    {
        id: "gen9-rare",
        title: "第9世代・SSR",
        subtitle: "帕底亞地區最珍貴的配布",
        generation: 9,
        tier: "rare",
        description:
            "故勒頓、密勒頓與太樂巴戈斯——帕底亞最珍貴的稀有配布。",
        coverImage: "/guides/gen9_paldea.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen9-premium",
        title: "第9世代・SR",
        subtitle: "帕底亞地區的優質收藏",
        generation: 9,
        tier: "premium",
        description:
            "太晶化時代的高級配布紀錄，結晶之冠的珍貴力量。",
        coverImage: "/guides/gen9_tera.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen9-common",
        title: "第9世代・R",
        subtitle: "帕底亞地區的基礎配布",
        generation: 9,
        tier: "common",
        description:
            "帕底亞地區的基礎配布合集，朱紫時代的日常冒險。",
        coverImage: "/guides/gen9_zero.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },
];

// 按世代分組
export function getBooksByGeneration(): Record<number, GuideBook[]> {
    return guideBooks.reduce(
        (acc, book) => {
            if (!acc[book.generation]) acc[book.generation] = [];
            acc[book.generation].push(book);
            return acc;
        },
        {} as Record<number, GuideBook[]>
    );
}

// 世代名稱
export const genNames: Record<number, string> = {
    1: "關都地區",
    2: "城都地區",
    3: "豐緣地區",
    4: "神奧地區",
    5: "合眾地區",
    6: "卡洛斯地區",
    7: "阿羅拉地區",
    8: "伽勒爾地區",
    9: "帕底亞地區",
};

// 世代遊戲名稱
export const genGames: Record<number, string> = {
    1: "赤・綠・藍・黃 (30 週年紀念) / Let's Go",
    2: "金・銀・水晶",
    3: "紅寶石・藍寶石・綠寶石",
    4: "鑽石・珍珠・白金 / BDSP / PLA",
    5: "黑・白 / 黑2・白2",
    6: "X・Y / ORAS",
    7: "太陽・月亮 / USUM",
    8: "劍・盾 / BDSP / PLA",
    9: "朱・紫 / DLC",
};
