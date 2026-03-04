/**
 * 競標留言 Fallback 池（300 條）
 * 當 LLM 不可用時使用，每條用過即移除，用完即停止留言。
 */

// ── 興奮 / 驚呼（40 條）──
const EXCITEMENT = [
    "這隻好難得！",
    "競標好刺激 🔥",
    "衝了衝了！",
    "太美了吧這隻",
    "是我想要的配布！",
    "這隻超稀有",
    "這隻終於出現了",
    "夢寐以求的配布",
    "我的天 居然有這隻",
    "不敢相信居然上架了",
    "尖叫！！！",
    "我等這隻好久了",
    "終於等到你了 😭",
    "天啊天啊天啊",
    "這不搶對不起自己",
    "心跳加速中",
    "瞳孔地震",
    "我快瘋了這隻居然有",
    "什麼！？上架了！？",
    "等了三個月終於來了",
    "尖叫到鄰居報警",
    "手在抖 太興奮了",
    "這隻出現我直接清醒",
    "居然是這隻！衝啊",
    "夢裡才會出現的配布",
    "看到的瞬間心跳漏一拍",
    "不是吧 竟然是牠",
    "腎上腺素飆升中",
    "整個人都醒了",
    "這場不能錯過",
    "我大叫了一聲 真的",
    "血壓飆高中",
    "這隻我找超久的",
    "夢幻逸品！",
    "活久見系列",
    "傳說中的那隻！",
    "嗚嗚嗚終於",
    "這就是命運",
    "我要哭了 居然有",
    "看到就知道今天是好日子",
];

// ── 觀望 / 猶豫（35 條）──
const WATCHING = [
    "等等再來看",
    "好猶豫要不要下手",
    "關注中 👀",
    "再觀望一下",
    "先卡位",
    "等結標",
    "看看就好...嗎",
    "錢包在顫抖",
    "理智跟我說不要",
    "猶豫就會敗北",
    "我在想要不要...",
    "默默觀察",
    "先看看風向",
    "還在考慮中",
    "內心好掙扎",
    "忍住忍住",
    "觀望一下再說",
    "想要但又怕超預算",
    "先存起來等下再看",
    "好想出手又好怕",
    "要不要搶呢...",
    "理性消費 理性消費",
    "把持住 我可以的",
    "默默加入最愛先",
    "冷靜 先冷靜一下",
    "今天先不衝動好了",
    "看看就好 看看就好",
    "心裡已經出價了但手沒動",
    "觀望中 不代表不想要",
    "等等看其他人怎麼出",
    "這場好難抉擇",
    "想了想還是算了...嗎",
    "邊看邊天人交戰",
    "先看完再說",
    "目前還在射程範圍內",
];

// ── 競價 / 價格討論（35 條）──
const BIDDING = [
    "加價了加價了",
    "剛剛有人出價嗎",
    "這價格很佛",
    "價格還OK",
    "誰剛剛加價的！",
    "又被超越了嗎",
    "價格開始飆了",
    "大佬們手下留情啊",
    "這價格我還能接受",
    "已經超出預算了...",
    "最低加價就好",
    "被搶了 😤",
    "多少才合理啊",
    "這場好卷",
    "價格戰開始了",
    "穩住 不要衝動",
    "這價格還行 可以追",
    "誰在偷偷加啊",
    "好傢伙 又漲了",
    "行情就是這樣吧",
    "超預算了 掰掰",
    "再加一次就好...",
    "這個起標價很甜",
    "有點高了但值得",
    "感覺還會再漲",
    "目前價格算合理",
    "已經是市場價了吧",
    "還好 在預算內",
    "每次加一點點好煎熬",
    "又有新出價了",
    "有人跟我搶！",
    "價格什麼時候停啊",
    "你們太狠了吧",
    "我的極限就到這了",
    "看來要破紀錄了",
];

// ── 倒數 / 緊張（25 條）──
const COUNTDOWN = [
    "最後幾分鐘了",
    "快結束了！",
    "最後衝刺！",
    "倒數計時中",
    "來不及了嗎",
    "最後三十秒！",
    "緊張緊張",
    "要結標了欸",
    "手速要快！",
    "進入最後階段",
    "心臟快受不了",
    "最後機會了！",
    "誰能撐到最後",
    "結標倒數中",
    "衝刺！衝刺！",
    "快快快來不及了",
    "倒數了各位注意",
    "Final countdown!",
    "手放在按鈕上了",
    "最後十秒！",
    "屏氣凝神中",
    "時間到了嗎！？",
    "最後關頭了",
    "準備搶標！",
    "最後殊死搏鬥",
];

// ── 祈禱 / 想要（25 條）──
const WISHING = [
    "求讓給我 🙏",
    "拜託讓我",
    "好想要啊",
    "許願成功 🤞",
    "老天保佑",
    "拜拜拜拜拜",
    "求求各位大佬放過我",
    "我真的很需要這隻",
    "拜託拜託拜託",
    "今天一定要帶走",
    "許願今天能標到",
    "求人品爆發",
    "今天運氣罩我",
    "如果標到就吃素一天",
    "祈禱沒有人加價了",
    "閉眼出價 老天決定",
    "求求了 就這一次",
    "拜託讓我撿漏",
    "讓給我吧大佬們",
    "標到就去還願",
    "這隻我真的超想要",
    "上天啊 保佑我",
    "默念三遍 我可以的",
    "希望這次能順利",
    "命運之標 🙏",
];

// ── 評價 / 討論（30 條）──
const EVALUATION = [
    "值得收藏",
    "收藏價值很高",
    "這個OT很有意義",
    "配布的故事很棒",
    "經典中的經典",
    "這隻的來歷很厲害",
    "品相不錯",
    "完美的配布",
    "光看就很開心",
    "好可愛啊啊啊",
    "這隻的設計超精緻",
    "這配布有故事性",
    "質感很好欸",
    "稀有度很高這隻",
    "真的是上品",
    "這隻圖鑑上很少見",
    "配布日期好有紀念價值",
    "真的是絕版了吧",
    "這隻在國外超搶手",
    "很適合收藏展示",
    "超棒的附加道具",
    "這活動限定的吧",
    "品質保證 讚",
    "百看不厭的設計",
    "有種夢幻的感覺",
    "適合鎮店之寶",
    "神獸就是不一樣",
    "純欣賞也值了",
    "配布證明好漂亮",
    "各方面都無可挑剔",
];

// ── 閒聊 / 打招呼（40 條）──
const CASUAL = [
    "大家好",
    "嗨嗨 👋",
    "安安",
    "來了來了",
    "報到報到",
    "路過看看",
    "午安各位",
    "早安 今天也來搶標",
    "好久不見大家",
    "最近活動好多",
    "社群越來越熱鬧",
    "每天都要來看看",
    "今天有什麼好物嗎",
    "來逛逛",
    "收藏控報到",
    "每日簽到打卡",
    "今天上了什麼新貨",
    "大家都在搶什麼",
    "好無聊 來看看",
    "邊吃飯邊逛",
    "睡前再看一場",
    "上班偷偷開",
    "又要剁手了",
    "這個月預算要爆了",
    "忍住不花錢好難",
    "競標使我快樂",
    "又來了 我上癮了",
    "下午茶時間 配競標",
    "吃完飯第一件事就是開這個",
    "每場都不想錯過",
    "今天手氣好嗎大家",
    "剛從另一場過來",
    "精神糧食 營養滿分",
    "假裝在工作其實在看競標",
    "午休黃金時段",
    "晚安各位 臨走前再看一眼",
    "今天星期幾 不重要 搶標就對了",
    "咖啡配競標 完美組合",
    "老面孔們好啊",
    "期待今天的場次",
];

// ── 情緒 / 短反應（30 條）──
const REACTIONS = [
    "緊張刺激",
    "加油加油",
    "有人一起嗎",
    "難得看到上線",
    "哈哈又來了",
    "螢幕前嚴陣以待",
    "呵呵",
    "哈哈 +1",
    "笑死",
    "Good taste!",
    "Nice!",
    "👍👍",
    "贏 🤯",
    "太猛了",
    "瘋了吧",
    "可以的",
    "讚",
    "respect 🫡",
    "6666",
    "厲害厲害",
    "哇噻",
    "服了",
    "真假！？",
    "扯",
    "牛",
    "好耶",
    "太帥了",
    "我看傻了",
    "驚了",
    "嘎嘎猛",
];

// ── 自嘲 / 搞笑（20 條）──
const SELF_DEPRECATING = [
    "看看就好 窮人的快樂",
    "我只配路過看看 🥲",
    "出不起就在旁邊鼓掌",
    "這輩子大概標不到了",
    "看完把錢存起來",
    "理想很豐滿 錢包很骨感",
    "預算：0 夢想：無限",
    "窮人的眼淚",
    "買不起 但我看得起",
    "我就看看 不出手",
    "錢啊 你在哪裡",
    "非洲人日常",
    "我的歐洲之旅遙遙無期",
    "月底了 只能圍觀",
    "吃土也要搶嗎...",
    "等我中樂透再來",
    "下輩子再來掃貨",
    "荷包在哭但心在笑",
    "看別人搶也是一種樂趣",
    "精神上我已經擁有了",
];

// ── @ 互動模板（20 條）──
export const INTERACTION_TEMPLATES = [
    (name: string) => `@${name} 你也在喔`,
    (name: string) => `@${name} 這隻你有興趣嗎`,
    (name: string) => `@${name} 一起競標！`,
    (name: string) => `@${name} 加油`,
    (name: string) => `@${name} 好久不見`,
    (name: string) => `@${name} 你收了嗎`,
    (name: string) => `@${name} 上一場有搶到嗎`,
    (name: string) => `@${name} 這場交給你了`,
    (name: string) => `@${name} 小心 有大佬出沒`,
    (name: string) => `@${name} 你覺得這場值多少`,
    (name: string) => `@${name} 穩住 別衝動`,
    (name: string) => `@${name} 幫你加油 💪`,
    (name: string) => `@${name} 你怎麼場場都在`,
    (name: string) => `@${name} 今天一起掃貨嗎`,
    (name: string) => `@${name} 大佬 留點機會啊`,
    (name: string) => `@${name} 等下結束後聊聊`,
    (name: string) => `@${name} 你也太拼了`,
    (name: string) => `@${name} 看你的收藏就知道是行家`,
    (name: string) => `@${name} 下次可以一起競標嗎`,
    (name: string) => `@${name} 難怪看你很眼熟`,
];

// ── @ 回覆 fallback 模板（20 條）──
export const REPLY_TEMPLATES = [
    (name: string) => `@${name} 真的嗎？`,
    (name: string) => `@${name} 有道理欸`,
    (name: string) => `@${name} 我也這樣想`,
    (name: string) => `@${name} 認真？`,
    (name: string) => `@${name} 怎麼說？`,
    (name: string) => `@${name} 哈哈 同意`,
    (name: string) => `@${name} +1`,
    (name: string) => `@${name} 確實`,
    (name: string) => `@${name} 太真實了`,
    (name: string) => `@${name} 你是老手齁`,
    (name: string) => `@${name} 學到了`,
    (name: string) => `@${name} 感覺你很懂耶`,
    (name: string) => `@${name} 對對對`,
    (name: string) => `@${name} 長知識了`,
    (name: string) => `@${name} respect 🫡`,
    (name: string) => `@${name} 真的假的！`,
    (name: string) => `@${name} 說得好`,
    (name: string) => `@${name} 我正想說這個`,
    (name: string) => `@${name} 被你說中了`,
    (name: string) => `@${name} 原來如此`,
];

// ══════════════════════════════════════════════
// 合併為 300 條 fallback 主池（一般留言，不含 @ 模板）
// ══════════════════════════════════════════════
const ALL_FALLBACK_COMMENTS: string[] = [
    ...EXCITEMENT,      // 40
    ...WATCHING,        // 35
    ...BIDDING,         // 35
    ...COUNTDOWN,       // 25
    ...WISHING,         // 25
    ...EVALUATION,      // 30
    ...CASUAL,          // 40
    ...REACTIONS,       // 30
    ...SELF_DEPRECATING // 20
];
// Total: 280 — pad to 300 with extras
const EXTRAS = [
    "這場次也太精彩",
    "看到好東西精神都來了",
    "每次都要跟大佬們搶",
    "被大佬支配的恐懼",
    "今天是個標東西的好日子",
    "看到這隻我眼睛亮了",
    "有沒有人要組團",
    "標到就是賺到",
    "人生就是要搶標",
    "這波穩了嗎",
    "進來就出不去了",
    "好像有寶物上架了",
    "目不轉睛中",
    "已經第三杯咖啡了",
    "旁邊的同事問我在幹嘛",
    "不管了 先標再說",
    "今天的場次太精彩了吧",
    "請問這裡是天堂嗎",
    "我太愛這個平台了",
    "沒有什麼事是一場競標解決不了的",
];

export const FALLBACK_POOL: string[] = [...ALL_FALLBACK_COMMENTS, ...EXTRAS];
// 確保剛好 300 條（如有多餘會被 slice）
if (FALLBACK_POOL.length > 300) {
    FALLBACK_POOL.length = 300;
}

/**
 * Fallback 池管理器
 * - 每條留言用過即從可用池中移除
 * - 用完 300 條就停止
 * - 使用 Fisher-Yates shuffle 保證隨機性
 */
export class FallbackPoolManager {
    private available: string[];
    private interactionAvailable: ((name: string) => string)[];
    private replyAvailable: ((name: string) => string)[];

    constructor() {
        // 深拷貝 + 打亂順序
        this.available = this.shuffle([...FALLBACK_POOL]);
        this.interactionAvailable = this.shuffle([...INTERACTION_TEMPLATES]);
        this.replyAvailable = this.shuffle([...REPLY_TEMPLATES]);
    }

    private shuffle<T>(arr: T[]): T[] {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /** 取一條一般留言（用完回傳 null） */
    getComment(): string | null {
        if (this.available.length === 0) return null;
        return this.available.pop()!;
    }

    /** 取一條 @ 互動留言（用完回傳 null） */
    getInteraction(targetName: string): string | null {
        if (this.interactionAvailable.length === 0) return null;
        const template = this.interactionAvailable.pop()!;
        return template(targetName);
    }

    /** 取一條 @ 回覆留言（用完回傳 null） */
    getReply(targetName: string): string | null {
        if (this.replyAvailable.length === 0) return null;
        const template = this.replyAvailable.pop()!;
        return template(targetName);
    }

    /** 還剩多少條一般留言 */
    get remainingCount(): number {
        return this.available.length;
    }

    /** 池是否已枯竭（全部類型都用完） */
    get isExhausted(): boolean {
        return this.available.length === 0
            && this.interactionAvailable.length === 0
            && this.replyAvailable.length === 0;
    }
}
