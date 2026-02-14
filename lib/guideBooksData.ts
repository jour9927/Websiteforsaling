// 書本式配布圖鑑資料定義
// 每個世代 2~3 本主題書

export interface GuideBook {
    id: string;
    title: string;
    subtitle: string;
    generation: number;
    description: string;
    coverImage: string;
    themeGradient: string;
    themeColor: string;
    accentColor: string;
    // 用於從 distributions 中篩選配布的世代範圍
    genFilter: number[];
}

export const guideBooks: GuideBook[] = [
    // ── 第一世代 ──
    {
        id: "gen1-legendary",
        title: "初代傳說配布",
        subtitle: "超夢與夢幻的軌跡",
        generation: 1,
        description:
            "收錄關都地區最具傳奇色彩的配布寶可夢。從初代超夢到夢幻，見證配布歷史的起點。每一隻都承載著訓練師們最珍貴的回憶。",
        coverImage: "/guides/gen1_legendary.png",
        themeGradient: "from-red-500 to-red-700",
        themeColor: "red",
        accentColor: "text-red-400",
        genFilter: [1],
    },
    {
        id: "gen1-classic",
        title: "經典幻之旅",
        subtitle: "初始御三家的奇幻冒險",
        generation: 1,
        description:
            "妙蛙種子、小火龍、傑尼龜——每個訓練家的冒險都從這裡開始。本書收錄第一世代最經典的配布紀錄，帶你重溫那段純粹的感動。",
        coverImage: "/guides/gen1_classic.png",
        themeGradient: "from-amber-500 to-orange-600",
        themeColor: "amber",
        accentColor: "text-amber-400",
        genFilter: [1],
    },

    // ── 第二世代 ──
    {
        id: "gen2-chronicle",
        title: "城都編年記",
        subtitle: "鳳王與洛奇亞的傳說",
        generation: 2,
        description:
            "金色與銀色的光輝交織，鳳王與洛奇亞翱翔於城都上空。本書記載第二世代所有重要配布事件，見證城都地區的輝煌時代。",
        coverImage: "/guides/gen2_chronicle.png",
        themeGradient: "from-yellow-500 to-yellow-700",
        themeColor: "yellow",
        accentColor: "text-yellow-400",
        genFilter: [2],
    },
    {
        id: "gen2-secret",
        title: "金銀秘境",
        subtitle: "雪拉比的時空之旅",
        generation: 2,
        description:
            "在雪拉比守護的森林深處，時間靜止而永恆。本書探索第二世代中最神秘的幻之配布，揭開城都地區不為人知的秘密。",
        coverImage: "/guides/gen2_secret.png",
        themeGradient: "from-emerald-500 to-teal-600",
        themeColor: "emerald",
        accentColor: "text-emerald-400",
        genFilter: [2],
    },

    // ── 第三世代 ──
    {
        id: "gen3-hoenn",
        title: "豐緣寶典",
        subtitle: "大地與海洋的史詩",
        generation: 3,
        description:
            "固拉多的烈焰灼燒大地，蓋歐卡的巨浪撼動海洋，烈空坐居高臨下守護天際。本書完整記錄第三世代磅礴壯闘的配布歷程。",
        coverImage: "/guides/gen3_hoenn.png",
        themeGradient: "from-emerald-500 to-emerald-700",
        themeColor: "emerald",
        accentColor: "text-emerald-400",
        genFilter: [3],
    },
    {
        id: "gen3-myth",
        title: "神話誕生紀",
        subtitle: "基拉祈與乘龍的星空",
        generation: 3,
        description:
            "當千年彗星劃過天際，基拉祈甦醒實現願望。代歐奇希斯從宇宙深處降臨。本書收錄第三世代最具神話色彩的幻之寶可夢配布。",
        coverImage: "/guides/gen3_myth.png",
        themeGradient: "from-indigo-500 to-blue-700",
        themeColor: "indigo",
        accentColor: "text-indigo-400",
        genFilter: [3],
    },

    // ── 第四世代 ──
    {
        id: "gen4-sinnoh",
        title: "神奧傳承錄",
        subtitle: "帝牙盧卡與帕路奇亞",
        generation: 4,
        description:
            "時間之神帝牙盧卡與空間之神帕路奇亞，掌控著維度的根基。本書記載神奧地區最核心的傳說配布，揭開時空的奧秘。",
        coverImage: "/guides/gen4_sinnoh.png",
        themeGradient: "from-blue-500 to-blue-700",
        themeColor: "blue",
        accentColor: "text-blue-400",
        genFilter: [4],
    },
    {
        id: "gen4-rift",
        title: "時空裂隙手札",
        subtitle: "騎拉帝納的反轉世界",
        generation: 4,
        description:
            "在被扭曲的反轉世界裡，騎拉帝納靜靜守護著維度的平衡。本書深入探索第四世代最黑暗、最神秘的配布領域。",
        coverImage: "/guides/gen4_rift.png",
        themeGradient: "from-gray-600 to-purple-800",
        themeColor: "purple",
        accentColor: "text-purple-400",
        genFilter: [4],
    },
    {
        id: "gen4-creation",
        title: "創世神典",
        subtitle: "阿爾宙斯的神聖之光",
        generation: 4,
        description:
            "萬物的創造者阿爾宙斯，從虛無中誕生宇宙。本書是第四世代最頂級的配布典籍，收錄創世神話等級的夢幻配布。",
        coverImage: "/guides/gen4_creation.png",
        themeGradient: "from-amber-400 to-yellow-600",
        themeColor: "yellow",
        accentColor: "text-yellow-300",
        genFilter: [4],
    },

    // ── 第五世代 ──
    {
        id: "gen5-unova",
        title: "合眾啟示錄",
        subtitle: "萊希拉姆與捷克羅姆",
        generation: 5,
        description:
            "黑與白的對決，真實與理想的碰撞。萊希拉姆的烈焰與捷克羅姆的雷擊交織出第五世代最壯烈的配布傳奇。",
        coverImage: "/guides/gen5_unova.png",
        themeGradient: "from-gray-500 to-gray-700",
        themeColor: "gray",
        accentColor: "text-gray-300",
        genFilter: [5],
    },
    {
        id: "gen5-awakening",
        title: "黑白覺醒記",
        subtitle: "酋雷姆的冰封真相",
        generation: 5,
        description:
            "當萊希拉姆與捷克羅姆的力量融合，酋雷姆覺醒了完整的形態。本書收錄第五世代後期最精彩的配布紀錄。",
        coverImage: "/guides/gen5_awakening.png",
        themeGradient: "from-cyan-400 to-blue-600",
        themeColor: "cyan",
        accentColor: "text-cyan-400",
        genFilter: [5],
    },

    // ── 第六世代 ──
    {
        id: "gen6-kalos",
        title: "卡洛斯圖錄",
        subtitle: "哲爾尼亞斯與伊裴爾塔爾",
        generation: 6,
        description:
            "生命之鹿哲爾尼亞斯與破壞之翼伊裴爾塔爾。在優雅的卡洛斯地區，配布文化達到了前所未有的藝術高度。",
        coverImage: "/guides/gen6_kalos.png",
        themeGradient: "from-blue-400 to-blue-600",
        themeColor: "blue",
        accentColor: "text-blue-300",
        genFilter: [6],
    },
    {
        id: "gen6-mega",
        title: "MEGA 進化誌",
        subtitle: "超越極限的力量",
        generation: 6,
        description:
            "MEGA 進化——突破寶可夢潛力的極限！本書收錄所有與 MEGA 進化相關的特殊配布，見證進化石的璀璨光芒。",
        coverImage: "/guides/gen6_mega.png",
        themeGradient: "from-violet-400 to-fuchsia-600",
        themeColor: "violet",
        accentColor: "text-violet-400",
        genFilter: [6],
    },

    // ── 第七世代 ──
    {
        id: "gen7-alola",
        title: "阿羅拉風情記",
        subtitle: "索爾迦雷歐與露奈雅拉",
        generation: 7,
        description:
            "陽光與月光的守護者，在阿羅拉群島上演繹著日月傳說。本書帶你感受熱帶島嶼的活力與配布的獨特魅力。",
        coverImage: "/guides/gen7_alola.png",
        themeGradient: "from-orange-500 to-orange-700",
        themeColor: "orange",
        accentColor: "text-orange-400",
        genFilter: [7],
    },
    {
        id: "gen7-ultra",
        title: "究極異獸圖典",
        subtitle: "來自異次元的訪客",
        generation: 7,
        description:
            "究極之洞打開，異世界的生物湧入。本書記錄所有究極異獸相關的配布事件，探索超越認知的次元裂隙。",
        coverImage: "/guides/gen7_ultra.png",
        themeGradient: "from-pink-500 to-purple-700",
        themeColor: "pink",
        accentColor: "text-pink-400",
        genFilter: [7],
    },

    // ── 第八世代 ──
    {
        id: "gen8-galar",
        title: "伽勒爾紀行",
        subtitle: "蒼響與藏瑪然特的騎士傳說",
        generation: 8,
        description:
            "在伽勒爾的古老王國中，蒼響執劍、藏瑪然特持盾，守護著這片土地。本書記錄第八世代最壯麗的配布故事。",
        coverImage: "/guides/gen8_galar.png",
        themeGradient: "from-pink-500 to-pink-700",
        themeColor: "pink",
        accentColor: "text-pink-300",
        genFilter: [8],
    },
    {
        id: "gen8-dynamax",
        title: "極巨化圖鑑",
        subtitle: "無極汰那的暗黑能量",
        generation: 8,
        description:
            "極巨化能量改變了戰鬥的規則，而無極汰那正是這股力量的根源。本書深入探索極巨化現象與相關的限定配布。",
        coverImage: "/guides/gen8_dynamax.png",
        themeGradient: "from-rose-500 to-red-700",
        themeColor: "rose",
        accentColor: "text-rose-400",
        genFilter: [8],
    },

    // ── 第九世代 ──
    {
        id: "gen9-paldea",
        title: "帕底亞探索誌",
        subtitle: "故勒頓與密勒頓的時空旅程",
        generation: 9,
        description:
            "過去與未來在帕底亞交匯。故勒頓馳騁於遠古大地，密勒頓翱翔於未來天際。本書記錄第九世代全新的冒險配布。",
        coverImage: "/guides/gen9_paldea.png",
        themeGradient: "from-purple-500 to-violet-700",
        themeColor: "purple",
        accentColor: "text-purple-400",
        genFilter: [9],
    },
    {
        id: "gen9-tera",
        title: "太晶寶典",
        subtitle: "結晶之冠的奧秘",
        generation: 9,
        description:
            "太晶化——在帕底亞地區獨特的結晶現象。寶可夢頭頂閃耀的太晶寶冠蘊含著不可思議的力量。本書收錄太晶相關的珍稀配布。",
        coverImage: "/guides/gen9_tera.png",
        themeGradient: "from-amber-400 to-pink-500",
        themeColor: "amber",
        accentColor: "text-amber-300",
        genFilter: [9],
    },
    {
        id: "gen9-zero",
        title: "零區秘聞錄",
        subtitle: "太樂巴戈斯與大坑洞之謎",
        generation: 9,
        description:
            "在帕底亞大坑洞的最深處，沉睡著古老的秘密。太樂巴戈斯守護的零區藏著關於太晶化起源的真相。本書揭開第九世代最終章的面紗。",
        coverImage: "/guides/gen9_zero.png",
        themeGradient: "from-stone-500 to-amber-700",
        themeColor: "stone",
        accentColor: "text-stone-300",
        genFilter: [9],
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
