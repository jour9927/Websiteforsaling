"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { loadVirtualProfiles, VirtualProfile } from '@/lib/virtualProfiles';
import Link from 'next/link';

// 種子隨機數生成器（基於字串生成一致的隨機序列）
function createSeededRandom(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return function () {
        hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
        hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
        hash ^= hash >>> 16;
        return (hash >>> 0) / 4294967296;
    };
}

// 競標相關留言（80+ 句，多種語氣和情境）
const AUCTION_COMMENTS = [
    // 興奮型
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
    // 觀望型
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
    // 競價型
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
    // 倒數型
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
    // 請求/祈禱型
    "求讓給我 🙏",
    "拜託讓我",
    "好想要啊",
    "許願成功 🤞",
    "老天保佑",
    "拜拜拜拜拜",
    "求求各位大佬放過我",
    "我真的很需要這隻",
    // 評價型
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
    // 隨性型
    "緊張刺激",
    "加油加油",
    "有人一起嗎",
    "難得看到這隻上線",
    "這個價格還可以接受",
    "哈哈我又來了",
    "每場都不想錯過",
    "一邊上班一邊看",
    "午休時間來搶標",
    "今天手氣好嗎",
    "螢幕前嚴陣以待",
];

// 網站/活動/閒聊留言（90+ 句）
const SITE_COMMENTS = [
    // 打招呼
    "大家好",
    "大家晚安",
    "嗨嗨 👋",
    "安安",
    "來了來了",
    "我回來了",
    "報到報到",
    "路過看看",
    "下午好啊",
    "午安各位",
    "早安 今天也要來搶標",
    "晚安各位",
    "好久不見大家",
    "yo yo yo",
    "阿嚕 人好多",
    // 新手
    "新手報到！",
    "剛加入這個群",
    "第一次來",
    "請多指教 🙏",
    "新人問一下 怎麼玩",
    "第一次參加競標",
    "我是新來的 大家好",
    "剛註冊 聯絡報到",
    // 稱讚
    "新功能好方便",
    "這平台不錯欸",
    "介面很漂亮",
    "網站做得好精緻",
    "越來越好用了",
    "設計很用心欸",
    "整體體驗很流暢",
    "整個站的調性好讚",
    // 社群氛圍
    "最近活動好多",
    "社群越來越熱鬧",
    "現在競標場超熱鬧",
    "每天都要來看看",
    "通知響了馬上來",
    "終於有留言功能了",
    "今天有什麼好物嗎",
    "來逛逛",
    "有推薦的嗎",
    "這裡好多寶物",
    "收藏控報到",
    "今天運氣好嗎",
    "每日簽到打卡",
    "又是充實的一天",
    "今天上了什麼新貨",
    "有什麼必搶的嗎",
    "大家都在搶什麼",
    "哪場比較值得",
    "求推薦今天的場次",
    "今天行情如何",
    "幫我看看還有什麼好的",
    // 隨意閒聊
    "好無聊 來看看",
    "邊吃飯邊逛",
    "睡前再看一場",
    "上班偷偷開",
    "假裝在工作其實在看競標",
    "回家第一件事就是開這個",
    "又要剁手了",
    "這個月預算要爆了",
    "忍住不花錢好難",
    "呵呵 繼續守著",
    "聯絡來報到了",
    "今天豐收如何",
    "透氣一下",
    "又來競標了 欲罷不能",
    "這裡就是我的快樂泉源",
    "競標使我快樂",
    "又是美好的一天",
    "期待今天的場次",
];

// 模擬用戶相互 @ 對話（40 句）
const SIMULATED_INTERACTIONS = [
    (targetName: string) => `@${targetName} 你也在喔`,
    (targetName: string) => `@${targetName} 這隻你有興趣嗎`,
    (targetName: string) => `@${targetName} 一起競標！`,
    (targetName: string) => `@${targetName} 加油`,
    (targetName: string) => `@${targetName} 哈哈 你也來了`,
    (targetName: string) => `@${targetName} 等下要出嗎`,
    (targetName: string) => `@${targetName} 好久不見`,
    (targetName: string) => `@${targetName} 你收了嗎`,
    (targetName: string) => `@${targetName} 你上一場有搶到嗎`,
    (targetName: string) => `@${targetName} 這場交給你了 我放棄`,
    (targetName: string) => `@${targetName} 你今天手氣怎樣`,
    (targetName: string) => `@${targetName} 小心 有大佬出沒`,
    (targetName: string) => `@${targetName} 剛剛那場你有出嗎`,
    (targetName: string) => `@${targetName} 我們別搶同一場吧 😂`,
    (targetName: string) => `@${targetName} 你覺得這場值多少`,
    (targetName: string) => `@${targetName} 推薦你下一場`,
    (targetName: string) => `@${targetName} 你收藏了幾隻了`,
    (targetName: string) => `@${targetName} 每次都遇到你 哈哈`,
    (targetName: string) => `@${targetName} 你也是在等結標嗎`,
    (targetName: string) => `@${targetName} 穩住 別衝動`,
    (targetName: string) => `@${targetName} 幫你加油 💪`,
    (targetName: string) => `@${targetName} 看你要不要 我就不搶了`,
    (targetName: string) => `@${targetName} 你怎麼場場都在 太強了吧`,
    (targetName: string) => `@${targetName} 終於等到你上線`,
    (targetName: string) => `@${targetName} 今天一起組隊掃貨嗎`,
    (targetName: string) => `@${targetName} 你剛剛有看到嗎`,
    (targetName: string) => `@${targetName} 大佬 留點機會給我啊`,
    (targetName: string) => `@${targetName} 請問你還有預算嗎 哈哈`,
    (targetName: string) => `@${targetName} 你太誇張了吧`,
    (targetName: string) => `@${targetName} 我們口味很像耒`,
    (targetName: string) => `@${targetName} 只能說佩服`,
    (targetName: string) => `@${targetName} 等下結束後聊聊`,
    (targetName: string) => `@${targetName} 你也太拼了吧`,
    (targetName: string) => `@${targetName} 我們應該認識吧 常常看到你`,
    (targetName: string) => `@${targetName} 你是不是也在猜最終價`,
    (targetName: string) => `@${targetName} 看你的收藏就知道是行家`,
    (targetName: string) => `@${targetName} 你的收藏我看過了 太強`,
    (targetName: string) => `@${targetName} 下次可以一起競標嗎`,
    (targetName: string) => `@${targetName} 你有加我好友嗎`,
    (targetName: string) => `@${targetName} 難怪看你很眼熟`,
];

// 回覆真實用戶（40 句，更自然的互動風格）
const PSYCHOLOGY_REPLIES = [
    (name: string) => `@${name} 什麼意思？`,
    (name: string) => `@${name} 你說的是指...？`,
    (name: string) => `@${name} 真的嗎？`,
    (name: string) => `@${name} 有道理欸`,
    (name: string) => `@${name} 我也這樣想`,
    (name: string) => `@${name} 所以呢？`,
    (name: string) => `@${name} 認真？`,
    (name: string) => `@${name} 為什麼這樣說`,
    (name: string) => `@${name} 然後呢`,
    (name: string) => `@${name} 怎麼說？`,
    (name: string) => `@${name} 再說一次？`,
    (name: string) => `@${name} 展開講講`,
    (name: string) => `@${name} 哈哈 同意`,
    (name: string) => `@${name} 笑死 你說得對`,
    (name: string) => `@${name} +1`,
    (name: string) => `@${name} 我懂你的意思`,
    (name: string) => `@${name} 確實是這樣`,
    (name: string) => `@${name} 講得好`,
    (name: string) => `@${name} 我也有同感`,
    (name: string) => `@${name} 太真實了`,
    (name: string) => `@${name} 被你說中了`,
    (name: string) => `@${name} 你是老手齁`,
    (name: string) => `@${name} 學到了 謝謝`,
    (name: string) => `@${name} 原來如此`,
    (name: string) => `@${name} 感覺你很懂欸`,
    (name: string) => `@${name} 哈哈哈 贊同`,
    (name: string) => `@${name} 這樣啊 我了解了`,
    (name: string) => `@${name} 對對對 我也覺得`,
    (name: string) => `@${name} 感謝分享`,
    (name: string) => `@${name} 你提醒得好`,
    (name: string) => `@${name} 長知識了`,
    (name: string) => `@${name} 我居然沒想到`,
    (name: string) => `@${name} 說得有理`,
    (name: string) => `@${name} 喜歡你的想法`,
    (name: string) => `@${name} 你很懂行耒`,
    (name: string) => `@${name} 受教了`,
    (name: string) => `@${name} 我正想說這個`,
    (name: string) => `@${name} 同感同感`,
    (name: string) => `@${name} 真的假的！`,
    (name: string) => `@${name} respect 🫡`,
];

interface Comment {
    id: string;
    user_id?: string;
    virtual_user_id?: string;  // 虛擬用戶 ID（可點擊連結）
    user_name: string;
    content: string;
    created_at: string;
    is_simulated?: boolean;
    is_own?: boolean; // 是否為自己的留言
}

interface AuctionCommentsProps {
    auctionId: string;
    auctionTitle?: string;
    isActive: boolean;
    currentUserName?: string | null;
}

export default function AuctionComments({
    auctionId,
    auctionTitle = '',
    isActive,
    currentUserName,
    currentPrice = 0,
    endTime = ''
}: AuctionCommentsProps & { currentPrice?: number, endTime?: string | null }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [simulatedComments, setSimulatedComments] = useState<Comment[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // 追蹤已回覆的真實用戶（每人回覆次數限制）
    const repliedUsersRef = useRef<Map<string, number>>(new Map());
    // 追蹤模擬用戶（用於相互 @）
    const activeSimUsersRef = useRef<VirtualProfile[]>([]);
    // 快取的虛擬用戶列表
    const virtualProfilesRef = useRef<VirtualProfile[]>([]);
    // 追蹤是否已初始化模擬留言（避免重複初始化）
    const simulationInitializedRef = useRef(false);
    // 用 ref 追蹤最新的 comments（避免 useEffect 依賴 comments state）
    const commentsRef = useRef<Comment[]>([]);

    // 取得當前用戶
    useEffect(() => {
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', authUser.id)
                    .single();
                setUser({
                    id: authUser.id,
                    name: profile?.full_name || currentUserName || '匿名'
                });
            }
        };
        getUser();
    }, [currentUserName]);

    // 載入所有留言（包含真實 + DB 中的模擬留言）
    useEffect(() => {
        const loadComments = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const { data } = await supabase
                .from('auction_comments')
                .select('*')
                .eq('auction_id', auctionId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) {
                setComments(data.map(c => ({
                    ...c,
                    is_simulated: c.is_simulated || false,
                    is_own: authUser ? c.user_id === authUser.id : false
                })));
            }
        };
        loadComments();

        // 即時訂閱新留言（包含模擬留言寫入 DB 的情況）
        const channel = supabase
            .channel(`auction_comments_${auctionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'auction_comments',
                filter: `auction_id=eq.${auctionId}`
            }, async (payload) => {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const newComment = payload.new as Comment;
                // 如果是模擬留言（由 triggerSimulatedReply 寫入 DB），從 simulatedComments 移除對應的臨時項目
                if (newComment.is_simulated) {
                    setSimulatedComments(prev => prev.filter(c => c.id !== `pending-reply-${newComment.created_at}`));
                }
                setComments(prev => {
                    // 避免重複（已由樂觀更新或其他途徑加入）
                    if (prev.some(c => c.id === newComment.id)) return prev;
                    return [...prev, {
                        ...newComment,
                        is_simulated: newComment.is_simulated || false,
                        is_own: authUser ? newComment.user_id === authUser.id : false
                    }];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [auctionId]);

    // 同步 comments 到 ref（讓 useEffect 內部讀最新值，不觸發重跑）
    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);

    // 同步 simulatedComments 到 ref
    const simulatedCommentsRef = useRef<Comment[]>([]);
    useEffect(() => {
        simulatedCommentsRef.current = simulatedComments;
    }, [simulatedComments]);

    // 初始模擬留言 + 定時新增
    useEffect(() => {
        if (!isActive) return;

        // 避免重複初始化（例如 React StrictMode 或依賴變化重跑）
        if (simulationInitializedRef.current) return;
        simulationInitializedRef.current = true;

        // 建立基於競標ID + 日期的種子隨機
        const today = new Date().toISOString().split('T')[0];
        const seededRandom = createSeededRandom(`${auctionId}-${today}`);

        // 使用種子隨機選擇留言（初始留言固定）
        const getSeededComment = () => {
            const useAuction = seededRandom() > 0.3;
            const pool = useAuction ? AUCTION_COMMENTS : SITE_COMMENTS;
            return pool[Math.floor(seededRandom() * pool.length)];
        };

        // 使用真隨機選擇留言（動態留言）
        const getRandomComment = () => {
            const pool = Math.random() > 0.3 ? AUCTION_COMMENTS : SITE_COMMENTS;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        // 載入虛擬用戶並初始化
        const initSimulation = async () => {
            const profiles = await loadVirtualProfiles();
            virtualProfilesRef.current = profiles;

            if (profiles.length === 0) return;

            // 使用種子隨機選擇初始用戶（固定）
            const userIndex1 = Math.floor(seededRandom() * profiles.length);
            const userIndex2 = Math.floor(seededRandom() * profiles.length);
            const user1 = profiles[userIndex1];
            const user2 = profiles[userIndex2 === userIndex1 ? (userIndex2 + 1) % profiles.length : userIndex2];

            activeSimUsersRef.current = [user1, user2];

            const initialSimulated: Comment[] = [
                {
                    id: 'sim-1',
                    user_name: user1.display_name,
                    virtual_user_id: user1.id,
                    content: getSeededComment(),
                    created_at: new Date(Date.now() - 120000).toISOString(),
                    is_simulated: true
                },
                {
                    id: 'sim-2',
                    user_name: user2.display_name,
                    virtual_user_id: user2.id,
                    content: getSeededComment(),
                    created_at: new Date(Date.now() - 60000).toISOString(),
                    is_simulated: true
                }
            ];
            setSimulatedComments(initialSimulated);
        };

        initSimulation();

        const getRandomVirtualUser = (): VirtualProfile | null => {
            const profiles = virtualProfilesRef.current;
            if (profiles.length === 0) return null;
            const profile = profiles[Math.floor(Math.random() * profiles.length)];
            // 追蹤活躍的模擬用戶
            if (!activeSimUsersRef.current.find(u => u.id === profile.id)) {
                activeSimUsersRef.current.push(profile);
                if (activeSimUsersRef.current.length > 5) {
                    activeSimUsersRef.current.shift();
                }
            }
            return profile;
        };

        // 每 15-35 秒新增一個模擬留言
        const interval = setInterval(async () => {
            const virtualUser = getRandomVirtualUser();
            if (!virtualUser) return;

            // 隨機決定要採取哪種發言行為
            const rand = Math.random();
            let content: string = '';
            let simulatedName = virtualUser.display_name;

            try {
                if (rand < 0.2 && user) {
                    // 20% 機率且「有真實登入的觀看者在場」：才主動透過 LLM 生成符合當下情境的發言 (Spontaneous Chat)
                    // 計算剩餘時間狀態字串
                    let timeState = "熱烈進行中";
                    if (endTime) {
                        const remainingMs = new Date(endTime).getTime() - new Date().getTime();
                        if (remainingMs < 60000) timeState = "即將結標 (最後一分鐘內)";
                        else if (remainingMs > 300000) timeState = "剛開局不久";
                    }

                    // 收集最近聊天上下文（使用 ref 讀取最新值）
                    const recentChatCtx = [...commentsRef.current, ...simulatedCommentsRef.current]
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .slice(-3)
                        .map(c => `${c.user_name}: ${c.content}`)
                        .join('\n');

                    const response = await fetch('/api/generate-spontaneous', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            auctionTitle,
                            recentChat: recentChatCtx,
                            currentPrice,
                            timeRemaining: timeState
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        content = data.reply;
                        if (data.simulatedName) {
                            simulatedName = data.simulatedName;
                        }
                    } else {
                        throw new Error('Spontaneous API failed');
                    }
                } else if (rand < 0.45 && activeSimUsersRef.current.length > 1) {
                    // 25% 機率：兩個模擬帳號互相 @
                    const otherUsers = activeSimUsersRef.current.filter(u => u.id !== virtualUser.id);
                    const targetUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                    const interaction = SIMULATED_INTERACTIONS[Math.floor(Math.random() * SIMULATED_INTERACTIONS.length)];
                    content = interaction(targetUser.display_name);
                } else {
                    // 55% 機率：從靜態詞庫中隨便抽一句
                    content = getRandomComment();
                }
            } catch {
                // 如果 LLM 失敗或超時，降級回隨機詞庫
                content = getRandomComment();
            }

            if (!content) return;

            const newSimComment: Comment = {
                id: `sim-${Date.now()}`,
                user_name: simulatedName,
                virtual_user_id: virtualUser.id,
                content,
                created_at: new Date().toISOString(),
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, newSimComment].slice(-25));
        }, 15000 + Math.random() * 20000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, auctionId]);

    // 觸發模擬 @回覆（延遲 8-15 秒，每個用戶最多回覆 3 次，使用 LLM 生成）
    const triggerSimulatedReply = useCallback((userName: string, userComment: string) => {
        // 每個用戶最多被回覆 3 次
        const replyCount = repliedUsersRef.current.get(userName) || 0;
        if (replyCount >= 3) {
            return;
        }

        // 更新回覆計數
        repliedUsersRef.current.set(userName, replyCount + 1);

        // 延遲 8-15 秒後回覆
        setTimeout(async () => {
            const replyUser = virtualProfilesRef.current[Math.floor(Math.random() * virtualProfilesRef.current.length)];
            let replyContent: string;

            try {
                // 收集最近的聊天上下文（使用 ref 讀取最新值）
                const allChats = [...commentsRef.current, ...simulatedCommentsRef.current]
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .slice(-5)
                    .map(c => `${c.user_name}: ${c.content}`)
                    .join('\n');

                const res = await fetch('/api/generate-reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userComment,
                        auctionTitle: auctionTitle,
                        recentChat: allChats,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    replyContent = `@${userName} ${data.reply}`;
                } else {
                    throw new Error('API failed');
                }
            } catch {
                // 降級：使用預設回覆
                const fallback = PSYCHOLOGY_REPLIES[Math.floor(Math.random() * PSYCHOLOGY_REPLIES.length)];
                replyContent = fallback(userName);
            }

            const replyUserName = replyUser?.display_name || '會員**';
            const replyVirtualId = replyUser?.id;
            const replyCreatedAt = new Date().toISOString();

            // 先用臨時 ID 加入 state 立即顯示
            const tempReply: Comment = {
                id: `reply-${Date.now()}`,
                user_name: replyUserName,
                virtual_user_id: replyVirtualId,
                content: replyContent,
                created_at: replyCreatedAt,
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, tempReply].slice(-25));

            // 同時寫入 DB 持久化（不等待結果）
            supabase
                .from('auction_comments')
                .insert({
                    auction_id: auctionId,
                    user_id: null,
                    user_name: replyUserName,
                    content: replyContent,
                    is_simulated: true,
                    virtual_user_id: replyVirtualId,
                })
                .select()
                .single()
                .then(({ data, error }) => {
                    if (!error && data) {
                        // 用 DB 的真實 ID 替換臨時 ID
                        setSimulatedComments(prev => prev.map(c =>
                            c.id === tempReply.id ? { ...c, id: data.id } : c
                        ));
                    } else {
                        console.warn('Failed to persist simulated reply:', error?.message);
                    }
                });
        }, 8000 + Math.random() * 7000); // 8-15 秒
    }, [auctionTitle, auctionId]);

    // 送出留言
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || isSubmitting) return;

        const content = inputValue.trim();
        setIsSubmitting(true);
        setInputValue('');

        // 樂觀更新：立即顯示用戶的留言
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            user_name: user.name,
            content,
            created_at: new Date().toISOString(),
            is_simulated: false,
            is_own: true
        };
        setComments(prev => [...prev, optimisticComment]);

        try {
            const { data, error } = await supabase
                .from('auction_comments')
                .insert({
                    auction_id: auctionId,
                    user_id: user.id,
                    user_name: user.name,
                    content
                })
                .select()
                .single();

            if (!error && data) {
                // 用真實資料替換樂觀更新的留言
                setComments(prev => prev.map(c =>
                    c.id === optimisticComment.id
                        ? { ...data, is_simulated: false, is_own: true }
                        : c
                ));
                // 觸發模擬回覆（只會回一次）
                triggerSimulatedReply(user.name, content);
            } else {
                // 發生錯誤，移除樂觀更新的留言
                setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
                setInputValue(content); // 恢復輸入內容
            }
        } catch {
            // 發生錯誤，移除樂觀更新的留言
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setInputValue(content);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 合併並排序所有留言（去重：DB 中的模擬留言可能同時存在於 comments 和 simulatedComments）
    const dbCommentIds = new Set(comments.map(c => c.id));
    const uniqueSimulated = simulatedComments.filter(c => !dbCommentIds.has(c.id));
    const allComments = [...comments, ...uniqueSimulated]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-30); // 只顯示最新 30 條

    // 自動捲動到最新
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allComments.length]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '剛剛';
        if (diffMins < 60) return `${diffMins}分鐘前`;
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-3">💬 即時留言</h3>

            {/* 留言列表 */}
            <div className="h-48 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin">
                {allComments.length === 0 ? (
                    <p className="text-xs text-white/40 text-center py-4">還沒有留言，快來說點什麼吧！</p>
                ) : (
                    allComments.map(comment => (
                        <div key={comment.id} className={`flex items-start gap-2 text-xs animate-fadeIn ${comment.is_own ? 'bg-purple-500/10 -mx-2 px-2 py-1 rounded-lg' : ''
                            }`}>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${comment.is_own
                                ? 'bg-purple-500 text-white'
                                : comment.is_simulated
                                    ? 'bg-white/10 text-white/60'
                                    : 'bg-purple-500/30 text-purple-200'
                                }`}>
                                {comment.user_name.slice(0, 1)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {/* 用戶名可點擊連結 */}
                                    {(comment.virtual_user_id || comment.user_id) && !comment.is_own ? (
                                        <Link
                                            href={`/user/${comment.virtual_user_id || comment.user_id}`}
                                            className={`font-medium hover:underline ${comment.is_simulated ? 'text-white/70' : 'text-purple-300'}`}
                                        >
                                            {comment.user_name}
                                        </Link>
                                    ) : (
                                        <span className={`font-medium ${comment.is_own
                                            ? 'text-purple-300'
                                            : comment.is_simulated
                                                ? 'text-white/70'
                                                : 'text-purple-300'
                                            }`}>
                                            {comment.user_name}
                                            {comment.is_own && <span className="ml-1 text-[10px] text-purple-400">(你)</span>}
                                        </span>
                                    )}
                                    <span className="text-white/40">{formatTime(comment.created_at)}</span>
                                </div>
                                <p className="text-white/80 mt-0.5 break-words">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* 輸入框 */}
            {isActive && user ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="說點什麼..."
                        maxLength={100}
                        className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSubmitting}
                        className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50"
                    >
                        {isSubmitting ? '...' : '送出'}
                    </button>
                </form>
            ) : isActive && !user ? (
                <p className="text-xs text-white/50 text-center">登入後即可留言</p>
            ) : null}
        </div>
    );
}
