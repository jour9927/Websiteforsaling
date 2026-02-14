// 書本式配布圖鑑資料定義
// 每個世代 3 本書，按配布稀有度分為：高貴、稀有、普通

export type BookTier = "noble" | "rare" | "common";

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
    noble: "高貴",
    rare: "稀有",
    common: "普通",
};

export const tierEmojis: Record<BookTier, string> = {
    noble: "👑",
    rare: "⭐",
    common: "📘",
};

// 根據同世代配布的 points 排序後，前 1/3 高貴、中 1/3 稀有、後 1/3 普通
export function classifyDistributionsByTier<
    T extends { points?: number | null },
>(distributions: T[]): Record<BookTier, T[]> {
    // 按 points 降序排列
    const sorted = [...distributions].sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0)
    );

    const total = sorted.length;
    const nobleEnd = Math.ceil(total / 3);
    const rareEnd = Math.ceil((total * 2) / 3);

    return {
        noble: sorted.slice(0, nobleEnd),
        rare: sorted.slice(nobleEnd, rareEnd),
        common: sorted.slice(rareEnd),
    };
}

export const guideBooks: GuideBook[] = [
    // ── 第一世代 ──
    {
        id: "gen1-noble",
        title: "第1世代・高貴配布",
        subtitle: "關都地區的頂級珍藏",
        generation: 1,
        tier: "noble",
        description:
            "收錄關都地區最具價值的頂級配布寶可夢。超夢、夢幻等傳說級配布，每一隻都是無價的珍藏。",
        coverImage: "/guides/gen1_legendary.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen1-rare",
        title: "第1世代・稀有配布",
        subtitle: "關都地區的珍稀收藏",
        generation: 1,
        tier: "rare",
        description:
            "中等稀有度的關都配布紀錄。每一筆都有其獨特的故事和收藏價值。",
        coverImage: "/guides/gen1_classic.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen1-common",
        title: "第1世代・普通配布",
        subtitle: "關都地區的基礎配布",
        generation: 1,
        tier: "common",
        description:
            "關都地區較常見的配布紀錄。雖不稀有，卻是每位訓練家旅程的基石。",
        coverImage: "/guides/gen1_classic.png",
        themeGradient: "from-slate-400 to-slate-600",
        themeColor: "slate",
        accentColor: "text-slate-300",
    },

    // ── 第二世代 ──
    {
        id: "gen2-noble",
        title: "第2世代・高貴配布",
        subtitle: "城都地區的頂級珍藏",
        generation: 2,
        tier: "noble",
        description:
            "鳳王與洛奇亞翱翔天際，雪拉比穿越時空——城都地區最珍貴的高貴配布大全。",
        coverImage: "/guides/gen2_chronicle.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen2-rare",
        title: "第2世代・稀有配布",
        subtitle: "城都地區的珍稀收藏",
        generation: 2,
        tier: "rare",
        description:
            "城都地區的中等稀有配布紀錄，金銀時代的獨特回憶。",
        coverImage: "/guides/gen2_secret.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen2-common",
        title: "第2世代・普通配布",
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
        id: "gen3-noble",
        title: "第3世代・高貴配布",
        subtitle: "豐緣地區的頂級珍藏",
        generation: 3,
        tier: "noble",
        description:
            "固拉多、蓋歐卡、烈空坐——豐緣三神獸與最古老的 GBA 時代高貴配布。距今 20 年的傳說。",
        coverImage: "/guides/gen3_hoenn.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen3-rare",
        title: "第3世代・稀有配布",
        subtitle: "豐緣地區的珍稀收藏",
        generation: 3,
        tier: "rare",
        description:
            "基拉祈、代歐奇希斯等神話級幻之寶可夢的稀有配布紀錄。",
        coverImage: "/guides/gen3_myth.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen3-common",
        title: "第3世代・普通配布",
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
        id: "gen4-noble",
        title: "第4世代・高貴配布",
        subtitle: "神奧地區的頂級珍藏",
        generation: 4,
        tier: "noble",
        description:
            "阿爾宙斯、帝牙盧卡、帕路奇亞——創世神話的頂級配布收藏。",
        coverImage: "/guides/gen4_creation.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen4-rare",
        title: "第4世代・稀有配布",
        subtitle: "神奧地區的珍稀收藏",
        generation: 4,
        tier: "rare",
        description:
            "騎拉帝納的反轉世界與時空裂隙的稀有配布紀錄。",
        coverImage: "/guides/gen4_rift.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen4-common",
        title: "第4世代・普通配布",
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
        id: "gen5-noble",
        title: "第5世代・高貴配布",
        subtitle: "合眾地區的頂級珍藏",
        generation: 5,
        tier: "noble",
        description:
            "萊希拉姆、捷克羅姆與酋雷姆——黑白之戰的高貴配布大全。",
        coverImage: "/guides/gen5_unova.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen5-rare",
        title: "第5世代・稀有配布",
        subtitle: "合眾地區的珍稀收藏",
        generation: 5,
        tier: "rare",
        description:
            "合眾地區的中等稀有配布紀錄，真實與理想的交會。",
        coverImage: "/guides/gen5_awakening.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen5-common",
        title: "第5世代・普通配布",
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
        id: "gen6-noble",
        title: "第6世代・高貴配布",
        subtitle: "卡洛斯地區的頂級珍藏",
        generation: 6,
        tier: "noble",
        description:
            "哲爾尼亞斯與伊裴爾塔爾的高貴配布。3DS 時代最珍貴的收藏。",
        coverImage: "/guides/gen6_kalos.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen6-rare",
        title: "第6世代・稀有配布",
        subtitle: "卡洛斯地區的珍稀收藏",
        generation: 6,
        tier: "rare",
        description:
            "MEGA 進化時代的稀有配布紀錄，突破極限的力量。",
        coverImage: "/guides/gen6_mega.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen6-common",
        title: "第6世代・普通配布",
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
        id: "gen7-noble",
        title: "第7世代・高貴配布",
        subtitle: "阿羅拉地區的頂級珍藏",
        generation: 7,
        tier: "noble",
        description:
            "索爾迦雷歐、露奈雅拉與究極異獸——阿羅拉群島最珍貴的高貴配布。",
        coverImage: "/guides/gen7_alola.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen7-rare",
        title: "第7世代・稀有配布",
        subtitle: "阿羅拉地區的珍稀收藏",
        generation: 7,
        tier: "rare",
        description:
            "究極之洞的稀有配布紀錄，來自異次元的珍貴訪客。",
        coverImage: "/guides/gen7_ultra.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen7-common",
        title: "第7世代・普通配布",
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
        id: "gen8-noble",
        title: "第8世代・高貴配布",
        subtitle: "伽勒爾地區的頂級珍藏",
        generation: 8,
        tier: "noble",
        description:
            "蒼響、藏瑪然特與無極汰那——伽勒爾騎士傳說的高貴配布。",
        coverImage: "/guides/gen8_galar.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen8-rare",
        title: "第8世代・稀有配布",
        subtitle: "伽勒爾地區的珍稀收藏",
        generation: 8,
        tier: "rare",
        description:
            "極巨化時代的稀有配布紀錄，劍盾的珍貴記憶。",
        coverImage: "/guides/gen8_dynamax.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen8-common",
        title: "第8世代・普通配布",
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
        id: "gen9-noble",
        title: "第9世代・高貴配布",
        subtitle: "帕底亞地區的頂級珍藏",
        generation: 9,
        tier: "noble",
        description:
            "故勒頓、密勒頓與太樂巴戈斯——帕底亞最珍貴的高貴配布。",
        coverImage: "/guides/gen9_paldea.png",
        themeGradient: "from-amber-500 to-yellow-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
    },
    {
        id: "gen9-rare",
        title: "第9世代・稀有配布",
        subtitle: "帕底亞地區的珍稀收藏",
        generation: 9,
        tier: "rare",
        description:
            "太晶化時代的稀有配布紀錄，結晶之冠的珍貴力量。",
        coverImage: "/guides/gen9_tera.png",
        themeGradient: "from-purple-500 to-pink-600",
        themeColor: "purple",
        accentColor: "text-purple-400",
    },
    {
        id: "gen9-common",
        title: "第9世代・普通配布",
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
    1: "紅・綠・藍・黃 / Let's Go",
    2: "金・銀・水晶",
    3: "紅寶石・藍寶石・綠寶石",
    4: "鑽石・珍珠・白金 / BDSP / PLA",
    5: "黑・白 / 黑2・白2",
    6: "X・Y / ORAS",
    7: "太陽・月亮 / USUM",
    8: "劍・盾 / BDSP / PLA",
    9: "朱・紫 / DLC",
};
