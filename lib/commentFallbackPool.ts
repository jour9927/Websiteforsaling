/**
 * 通用留言 Fallback 池（主頁 / 個人空間用）
 * 與 auctionFallbackPool.ts 架構相同，但內容適配一般社群情境。
 * 每條用過即移除，用完即停止留言。
 */

// ── 興奮 / 想要（20 條）──
const EXCITEMENT = [
    "好可愛！想要",
    "這隻超稀有的",
    "太讚了吧",
    "這配布很難得欸",
    "我也想要 😭",
    "這個必須搶",
    "天啊這個閃光太美了",
    "我的最愛！",
    "難得看到這隻",
    "機不可失",
    "夢寐以求的配布",
    "尖叫！！！",
    "終於等到了",
    "不搶對不起自己",
    "心跳加速中",
    "這隻我等好久了",
    "太美了吧",
    "我的天 居然有這隻",
    "看到這隻眼睛都亮了",
    "這隻絕對值得收藏",
];

// ── 評價 / 稱讚（20 條）──
const EVALUATION = [
    "性價比很高",
    "價格還可以接受",
    "這隻配招很棒",
    "收藏價值很高",
    "品相不錯",
    "經典中的經典",
    "完美的配布",
    "光看就很開心",
    "值得收藏",
    "這個OT很有意義",
    "好可愛啊啊啊",
    "絕版了吧這隻",
    "收藏超豐富的！",
    "整理得好用心耶",
    "真的是上品",
    "百看不厭的設計",
    "每隻都好棒",
    "這活動限定的吧",
    "適合鎮店之寶",
    "各方面都無可挑剔",
];

// ── 觀望 / 猶豫（15 條）──
const WATCHING = [
    "等等再看看",
    "有點猶豫",
    "好猶豫要不要下手",
    "先觀望一下",
    "錢包在顫抖",
    "理智跟我說不要",
    "猶豫就會敗北",
    "內心好掙扎",
    "先看看風向",
    "還在考慮中",
    "忍住忍住",
    "想要但又怕超預算",
    "理性消費 理性消費",
    "看看就好 看看就好",
    "邊看邊天人交戰",
];

// ── 競標相關（15 條）──
const BIDDING = [
    "衝了衝了",
    "最後一分鐘再來",
    "好緊張",
    "競標好刺激",
    "加油大家",
    "求讓 🙏",
    "已關注 ❤️",
    "這場好卷",
    "價格戰開始了",
    "穩住 不要衝動",
    "加價了加價了",
    "被搶了 😤",
    "最後衝刺！",
    "倒數計時中",
    "快結束了！",
];

// ── 社群 / 閒聊（30 條）──
const CASUAL = [
    "新手入坑中",
    "有人要一起買嗎",
    "這隻我收了好久",
    "大家晚安",
    "來了來了",
    "報到報到",
    "每天都要來看看",
    "又來逛了",
    "今天有什麼好物",
    "邊吃飯邊逛",
    "午休時間來看看",
    "回家第一件事就是開這個",
    "這個月預算要爆了",
    "又要剁手了",
    "收藏控報到",
    "好無聊 來看看",
    "今天運氣好嗎",
    "期待今天的場次",
    "又是美好的一天",
    "最近好多好物上架",
    "哈哈我又來了",
    "拜託讓我",
    "好想要啊",
    "路過看看",
    "大家好",
    "嗨嗨 👋",
    "安安",
    "最近活動好多",
    "社群越來越熱鬧",
    "每日簽到打卡",
];

// ══════════════════════════════════════════════
// 合併為主池
// ══════════════════════════════════════════════
const ALL_HOMEPAGE_COMMENTS: string[] = [
    ...EXCITEMENT,      // 20
    ...EVALUATION,      // 20
    ...WATCHING,        // 15
    ...BIDDING,         // 15
    ...CASUAL,          // 30
];
// Total: 100 條

/**
 * 主頁/通用留言 Fallback 池管理器
 * - 每條留言用過即從可用池中移除
 * - 使用 Fisher-Yates shuffle 保證隨機性
 * - 用完即停止
 */
export class HomepageFallbackPoolManager {
    private available: string[];

    constructor() {
        this.available = this.shuffle([...ALL_HOMEPAGE_COMMENTS]);
    }

    private shuffle<T>(arr: T[]): T[] {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /** 取一條留言（用完回傳 null） */
    getComment(): string | null {
        if (this.available.length === 0) return null;
        return this.available.pop()!;
    }

    /** 還剩多少條 */
    get remainingCount(): number {
        return this.available.length;
    }

    /** 池是否已枯竭 */
    get isExhausted(): boolean {
        return this.available.length === 0;
    }
}

// ══════════════════════════════════════════════
// 收藏感知留言模板（Fallback，不用 LLM 也能生成）
// ══════════════════════════════════════════════

type CollectionItem = {
    pokemon_name: string;
    points?: number;
    is_shiny?: boolean;
    event_name?: string;
};

const COLLECTION_TEMPLATES = [
    // 稱讚特定配布
    (d: CollectionItem) => `你的${d.pokemon_name}太讚了吧`,
    (d: CollectionItem) => `${d.pokemon_name}好可愛 😍`,
    (d: CollectionItem) => `${d.pokemon_name}也太美了`,
    (d: CollectionItem) => `好羨慕你有${d.pokemon_name}`,
    (d: CollectionItem) => `我也想要${d.pokemon_name} 😭`,
    (d: CollectionItem) => `${d.pokemon_name} 絕對是鎮店之寶`,
    (d: CollectionItem) => `${d.pokemon_name}的設計超棒`,
    // 點數相關
    (d: CollectionItem) => d.points ? `${d.points.toLocaleString()}pts 的配布太猛了` : `這隻配布太猛了`,
    (d: CollectionItem) => d.points ? `${d.pokemon_name} ${d.points.toLocaleString()}pts 真的厲害` : `${d.pokemon_name} 真的厲害`,
    (d: CollectionItem) => d.points && d.points >= 3000 ? `市值 ${d.points.toLocaleString()} 不玩的嗎` : `這市值不錯欸`,
    // 色違相關
    (d: CollectionItem) => d.is_shiny ? `色違${d.pokemon_name}太美了吧 ✨` : `${d.pokemon_name}太美了吧`,
    (d: CollectionItem) => d.is_shiny ? `✨色違的也太稀有` : `這隻好稀有`,
    (d: CollectionItem) => d.is_shiny ? `這色違我羨慕到哭` : `羨慕到哭`,
    // 活動相關
    (d: CollectionItem) => d.event_name ? `${d.event_name}的配布也太猛` : `配布也太猛`,
    (d: CollectionItem) => d.event_name ? `${d.event_name}你也有參加嗎` : `這活動你也有嗎`,
];

/**
 * 從收藏模板生成一條感知留言（Fallback 用，不需 LLM）
 * 隨機從 topDistributions 中挑一隻配布 + 隨機模板
 */
export function getCollectionAwareComment(
    topDistributions: CollectionItem[]
): string | null {
    if (!topDistributions || topDistributions.length === 0) return null;

    const dist = topDistributions[Math.floor(Math.random() * topDistributions.length)];
    const template = COLLECTION_TEMPLATES[Math.floor(Math.random() * COLLECTION_TEMPLATES.length)];
    return template(dist);
}

/**
 * 將 topDistributions 格式化為 LLM 可用的上下文字串
 * 例如：「#1 皮卡丘(✨色違, 5000pts, 25周年紀念), #2 噴火龍(3200pts)」
 */
export function buildCollectionContext(
    topDistributions: CollectionItem[],
    maxItems: number = 5
): string {
    if (!topDistributions || topDistributions.length === 0) return "";

    const items = topDistributions.slice(0, maxItems).map((d, i) => {
        const parts: string[] = [];
        if (d.is_shiny) parts.push("✨色違");
        if (d.points) parts.push(`${d.points.toLocaleString()}pts`);
        if (d.event_name) parts.push(d.event_name);
        const detail = parts.length > 0 ? `(${parts.join(", ")})` : "";
        return `#${i + 1} ${d.pokemon_name}${detail}`;
    });

    return `精選收藏：${items.join(", ")}`;
}

// ══════════════════════════════════════════════
// 個人空間虛擬留言池（80+ 條，供確定性抽樣用）
// ══════════════════════════════════════════════
export const PERSONAL_SPACE_COMMENTS: string[] = [
    // 稱讚收藏
    "收藏好漂亮！🌟",
    "太強了吧這收藏！",
    "收藏家 respect 🫡",
    "這收藏過份了吧",
    "看到你的收藏我自愧不如",
    "收藏超豐富的！",
    "每隻都好棒",
    "哇這個收藏太厲害了",
    "作為收藏家太佩服了",
    "整理得好用心耶",
    // 表達羨慕
    "大佬帶帶我 🙏",
    "好羨慕你的收藏",
    "你的願望清單我都想要 😂",
    "我也想要這些配布啊",
    "羨慕到哭",
    "看你的收藏我老了十歲",
    "你怎麼這麼多稀有的",
    "天呀這收藏值多少",
    // 問候/交流
    "什麼時候再上新的？",
    "可以交流一下嗎？",
    "有沒有興趣交換？",
    "你平常都玩哪一代？",
    "有沒有推薦的配布？",
    "你是從什麼時候開始收的？",
    "請問這隻是哪裡來的？",
    "你的配布都是自己收的嗎",
    // 新手/報到
    "新手報到！學習中 📚",
    "路過留言～",
    "期待你的新增收藏 👀",
    "第一次來報到",
    "常常來看看 👋",
    "你好～我也是新人",
    "朋友推薦過來的",
    "終於找到同好了",
    // 對話/雜談
    "這個配布我也有！",
    "我們口味很像耶",
    "你也喜歡這隻嗎",
    "哈哈哈 太可愛了",
    "好可愛的收藏頁面",
    "用心經營的空間耶",
    "每次來都有新發現",
    "你的頁面好好看",
    // 配布/遊戲相關
    "最近有什麼好配布嗎？",
    "最喜歡哪隻？",
    "有沒有稀有配布推薦",
    "最近競標好激烈",
    "這場活動你也有參加嗎？",
    "分享一下收藏心得吧",
    "封面圖好漂亮",
    "這隻的設計好精緻",
    // 情緒型
    "呵呵 好開心",
    "哈哈 +1",
    "笑死",
    "我懂了",
    "Good taste!",
    "Nice collection!",
    "👍👍",
    "贏🤯",
    // 小話/生活
    "今天運氣如何",
    "剛競標完過來看",
    "目前最想要的配布是哪隻",
    "先收藏了 有空再來看",
    "最近活動的配布你有嗎",
    "下次競標見！",
    "我最近也開始收了",
    "想跟你一樣有這麼多收藏",
    "這是我見過最豐富的收藏了",
    "尤其是那隻！太酷了",
    "哇塞 超有品味的感覺",
    "隨緣逛逛",
    // 補充
    "真羨慕你的收藏量！",
    "剛入坑的新人來學習了",
    "收藏真的太讚了！",
    "你的收藏讓我下定決心要認真收了",
    "太厲害了 佩服佩服",
    "希望有天我也能有這樣的收藏",
    "好用心的展示！",
    "看完覺得好療癒",
    "能交個朋友嗎？",
    "你的精選收藏好棒",
];

/**
 * 從個人空間留言池中做確定性不重複抽樣
 * 使用 hash 產生的種子來決定抽取順序，確保：
 * 1. 同一天看同一用戶 → 看到相同留言（確定性）
 * 2. 不同天 → 看到不同留言組合
 * 3. 同一頁面上不會出現重複留言
 */
export function sampleWithoutRepeat(
    pool: string[],
    count: number,
    seed: number
): string[] {
    // 建立索引陣列
    const indices = Array.from({ length: pool.length }, (_, i) => i);

    // 使用種子進行確定性 shuffle（seeded Fisher-Yates）
    let s = seed;
    const nextRand = () => {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        return s / 0x7fffffff;
    };

    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(nextRand() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // 取前 count 個不重複的結果
    return indices.slice(0, count).map(i => pool[i]);
}

// ══════════════════════════════════════════════
// Cron 虛擬留言擴充池（80 條）
// ══════════════════════════════════════════════
export const CRON_VIRTUAL_COMMENTS: string[] = [
    "收藏好漂亮！🌟",
    "大佬帶帶我 🙏",
    "什麼時候再上新的？",
    "好羨慕你的收藏",
    "這個配布我也有！",
    "可以交流一下嗎？",
    "新手報到！學習中 📚",
    "你的願望清單我都想要 😂",
    "收藏家 respect 🫡",
    "路過留言～",
    "太強了吧這收藏！",
    "期待你的新增收藏 👀",
    "真羨慕你的收藏量！",
    "剛入坑的新人來學習了",
    "收藏真的太讚了！",
    // 擴充部分（65 條新增）
    "每隻都好棒",
    "哇這個收藏太厲害了",
    "整理得好用心耶",
    "我也想要這些配布啊",
    "羨慕到哭",
    "你怎麼這麼多稀有的",
    "天呀這收藏值多少",
    "有沒有興趣交換？",
    "你平常都玩哪一代？",
    "有沒有推薦的配布？",
    "你是從什麼時候開始收的？",
    "請問這隻是哪裡來的？",
    "你的配布都是自己收的嗎",
    "第一次來報到",
    "常常來看看 👋",
    "你好～我也是新人",
    "朋友推薦過來的",
    "終於找到同好了",
    "我們口味很像耶",
    "你也喜歡這隻嗎",
    "哈哈哈 太可愛了",
    "好可愛的收藏頁面",
    "用心經營的空間耶",
    "每次來都有新發現",
    "你的頁面好好看",
    "最近有什麼好配布嗎？",
    "最喜歡哪隻？",
    "有沒有稀有配布推薦",
    "最近競標好激烈",
    "這場活動你也有參加嗎？",
    "分享一下收藏心得吧",
    "封面圖好漂亮",
    "這隻的設計好精緻",
    "Good taste!",
    "Nice collection!",
    "👍👍",
    "今天運氣如何",
    "剛競標完過來看",
    "下次競標見！",
    "我最近也開始收了",
    "想跟你一樣有這麼多收藏",
    "這是我見過最豐富的收藏了",
    "哇塞 超有品味的感覺",
    "隨緣逛逛",
    "你的收藏讓我下定決心要認真收了",
    "太厲害了 佩服佩服",
    "希望有天我也能有這樣的收藏",
    "好用心的展示！",
    "看完覺得好療癒",
    "能交個朋友嗎？",
    "你的精選收藏好棒",
    "作為收藏家太佩服了",
    "看到你的收藏我自愧不如",
    "這收藏過份了吧",
    "呵呵 好開心",
    "先收藏了 有空再來看",
    "最近活動的配布你有嗎",
    "尤其是那隻！太酷了",
    "目前最想要的配布是哪隻",
    "贏🤯",
];
