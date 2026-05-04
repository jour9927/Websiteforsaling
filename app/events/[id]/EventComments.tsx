const FAKE_NAMES = [
    "王**", "李**", "張**", "陳**", "林**", "黃**", "吳**", "周**",
    "謝**", "趙**", "徐**", "馬**", "朱**", "胡**", "高**", "羅**",
    "劉**", "鄭**", "蔡**", "許**", "郭**", "楊**", "曾**", "盧**",
    "邱**", "葉**", "宋**", "呂**", "賴**", "范**", "石**", "余**",
    "江**", "田**", "何**", "鍾**", "游**", "施**", "戴**", "簡**",
    "L***", "T***", "K***", "M***", "S***", "A***", "J***", "W***",
    "R***", "C***", "H***", "Y***", "D***", "N***", "B***", "F***",
    "P***", "G***", "E***", "V***", "X***", "Z***", "Q***", "I***",
    "色違獵人", "孵蛋廢人", "圖鑑收集狂", "搶標新手", "潛水路人", "小資族玩家",
    "寶可夢大師", "Pokemon迷", "閃光收藏家", "道館踢館王", "伊布控",
    "急凍鳥粉", "對戰狂人", "孵蛋達人", "野生捕手", "晨間訓練師",
    "夜間巡邏員", "團戰召集人", "散步訓練家", "百變怪迷", "超夢追隨者",
    "皮卡丘本命", "火箭隊員", "社群日玩家", "稀有Pokemon獵人", "傳說收集者",
    "Mega進化控", "太晶團戰王", "Pokemon睡眠玩家", "GoBattle達人", "Pokemon圖鑑完成者",
    "每日Pokemon捕手", "Pokemon散步黨", "Pokemon交換站長", "Pokemon補給員", "Pokemon對戰新手"
];

// ═══════════════════════════════════════════
// 葉伊布排除盲盒留言（名額極少引發怨言）
// ═══════════════════════════════════════════
const SYLVEON_COMMENTS = [
    "管理員終於加開第二梯次了😭 感恩的心感謝有你",
    "排除2隻還OK啦，第二梯次15個名額加起來30個勉強可以接受",
    "第二梯次開放了🔥 第一梯次沒中的來集合了！",
    "600多人搶30個位置還是很硬，但至少比15個好多了",
    "葉伊布欸！！第二波讓我抽到正式資格 🙏",
    "我以為預報名就等於報到了，結果還要排隊等審核",
    "第二梯次開跑中！管理團隊這次真的有在聽心聲👍",
    "第二波15個名額開放了…希望這次不要再落選了",
    "排除2隻不夠用啊，我想要的葉伊布是特定個體欸",
    "5/25當天一定會塞爆，我先預報名壓壓驚",
    "有沒有人知道審核標準是什麼？先報先審嗎",
    "葉伊布配布終於來了！但這名額數…我先哭一下",
    "一人一推拜託管理員加開名額 🙏🙏🙏 — 等等真的加開了！！感謝管理員！",
    "已經預報名了，現在每天祈禱被選中，第二梯次拜託了",
    "排除系統真的佛，但30個名額建議還是要抽選比較公平",
    "600多人搶30個，機率約5%，比第一梯次3%好多了",
    "這活動讓我想到抽選制演唱會，現在至少加開場次了",
    "管理員說預報名不等於成功，那到底怎麼篩人啊",
    "一人只能排一個嗎？還是我可以開小號搶",
    "拜託讓我中第二梯次…這輩子沒這麼想當那30人之一",
    "排除兩隻至少要排除葉伊布的進化前型態吧",
    "感覺這活動會變成傳說中不到5%的抽選地獄",
    "有人跟我一樣現在才發現第二梯次開了嗎？趕快來報",
    "5/25當天會公布結果嗎？好緊張，第二梯次也希望有好消息",
    "葉伊布的死忠粉站出來！30個名額大家一起搶",
    "希望審核是公平的，不要有內定 😤",
    "我已經把排除清單列好了，第二梯次一定要上車",
    "才30個名額，這種飢餓行銷我給過 🥲",
    "如果第二梯次沒中我可能會難過一個禮拜",
    "大家冷靜，第一梯次15個裡面說不定早就有內定了，但第二波應該公平吧（開玩笑的）",
    "這活動從預報名到第二梯次開放等好久，終於啊",
    "排除兩隻真的太少了，至少給排除五隻吧",
    "我已經準備好NT$9999了，第二梯次拜託選我",
    "600多人真的太誇張了，30個就夠了嗎",
    "隔壁仙子伊布盲盒50盒欸，我們葉伊布30個也不錯啦",
    "管理員真的在5/25前加碼了！管理員說到做到！",
    "這是我這輩子第一次這麼想當那30人之一",
    "葉伊布超可愛的，第二梯次一定要衝",
    "已經號召朋友一起預報名了，第二梯次一起上",
    "有沒有可能有人報了但沒付錢所以釋出名額啊",
    "5/25倒數中…每天醒來第一件事就是刷這頁",
    "排除機制很聰明但能不能先多開一點名額 😫",
    "15個名額排600多人，第二梯次應該也差不多，不敢想像當天的混亂場面",
    "這比任何配布活動都難搶，葉伊布真的好紅",
    "建議管理員名額加到30以上啦 — 等等真的加了！管理員我愛你",
    "如果要花9999還要排隊，感覺比盲盒還競爭",
    "求求老天爺讓我中第二梯次，我願意用一箱色違交換",
    "預報名的人數還在增加！第二梯次名額還夠嗎",
    "聽說有些人已經在討論要不要聯合抗議名額太少 — 結果加開了哈哈",
    "希望管理員能看到大家的心聲，第二梯次真的來了…",
    "我已經備好排除清單和扣打了，第二梯次就等5/25到來",
    "排除兩隻這個設計很貼心，但30名額也只是勉強可以",
    "這大概是我參加過最難搶的Pokemon活動了，兩梯次都難",
    "認真覺得應該要50個名額才合理，30也只是勉強啦",
    "如果第二梯次沒中，下次活動我一定第一個報到",
    "葉伊布排除盲盒這個概念太酷了，30個名額還是太少啦",
    "管理員大人，拜託聽到600多人的心聲好嗎 🥺",
    "5/25那天我請假在家守著，第二梯次要搶到",
    "聽說有人已經找了代搶服務，第二梯次一樣競爭",
    "30個名額可以理解啦，但為什麼不能再擴充一下",
];

// ═══════════════════════════════════════════
// 留言回覆串（營造討論熱度）
// ═══════════════════════════════════════════
const SYLVEON_REPLIES: Record<number, { name: string; text: string; time: string }[]> = {
    0: [
        { name: "謝**", text: "終於加開了！等好久 😭", time: "2026/5/5" },
        { name: "趙**", text: "第二梯次再沒中就認了", time: "2026/5/5" },
    ],
    1: [
        { name: "徐**", text: "排除2隻算客氣了，至少不是只能排除1隻", time: "2026/5/2" },
    ],
    2: [
        { name: "馬**", text: "第二梯次來啦！這次絕對要先卡位", time: "2026/5/5" },
        { name: "朱**", text: "兩梯次加起來30個，希望不要再秒殺了", time: "2026/5/5" },
    ],
    3: [
        { name: "胡**", text: "600多人搶30個起碼機率翻倍了", time: "2026/5/5" },
        { name: "高**", text: "翻倍還是不到5%啊…但至少有進步", time: "2026/5/5" },
    ],
    7: [
        { name: "羅**", text: "第二梯次開放了，這次一定要把握機會", time: "2026/5/5" },
        { name: "劉**", text: "沒中的快來集合，第二波衝刺", time: "2026/5/5" },
        { name: "鄭**", text: "趁現在人還不多趕快預報名", time: "2026/5/5" },
    ],
};

// ═══════════════════════════════════════════
// 暗影洛奇亞盲盒留言回覆串
// ═══════════════════════════════════════════
const LUGIA_REPLIES: Record<number, { name: string; text: string; time: string }[]> = {
    0: [
        { name: "蔡**", text: "你沒看錯，就是2個，不是打錯", time: "2026/5/2" },
        { name: "許**", text: "2個名額738人搶，管理團隊是在測試大家底線嗎", time: "2026/5/2" },
    ],
    4: [
        { name: "范**", text: "按鈕都壞了 能不內定嗎", time: "2026/5/2" },
    ],
    5: [
        { name: "呂**", text: "畢竟738人排 排到按鈕都壞了", time: "2026/5/2" },
        { name: "賴**", text: "這個問題回報屬於A類嚴重bug，你累計兩次可以跟管理員要求一隻自選六代配布", time: "2026/5/2" },
        { name: "石**", text: "你知道為啥700多人報名嗎 1.根本等不到 2.截圖拿bug獎", time: "2026/5/2" },
    ],
    7: [
        { name: "郭**", text: "不是羞辱人，是根本沒有要給人的意思", time: "2026/5/2" },
        { name: "楊**", text: "2個名額738人，你敢信這個比例", time: "2026/5/2" },
    ],
    12: [
        { name: "曾**", text: "0.27%我還以為是手遊UP池的機率", time: "2026/5/2" },
        { name: "盧**", text: "手遊至少有保底，這活動連保底都沒有", time: "2026/5/2" },
    ],
    19: [
        { name: "邱**", text: "不是做樣子不然是什麼，2個名額你敢信", time: "2026/5/2" },
        { name: "葉**", text: "我信，但我已經放棄了", time: "2026/5/2" },
        { name: "宋**", text: "明智的決定，我也放棄了", time: "2026/5/2" },
    ],
};

// ═══════════════════════════════════════════
// 暗影洛奇亞盲盒留言（2個名額引發絕望）
// ═══════════════════════════════════════════
const LUGIA_COMMENTS = [
    "2個名額？？？我沒看錯吧，這是開玩笑的嗎",
    "738人搶2個位置，機率連0.3%都不到，直接放棄，更何況按鈕根本壞掉是在搞？",
    "悲報 排隊人數卡在738人後就無法再排 按鈕失敗卡bug獎勵",
    "根本不可能上啦，洗洗睡比較實在",
    "這活動根本就是內定吧，2個名額開什麼玩笑",
    "有誰跟我一樣只是來按這個壞掉的按鈕然後螢幕錄影給管理員拿獎勵的",
    "圓形競技場的暗影洛奇亞耶…但2個名額是在羞辱人嗎",
    "738人報名只取2個？？？這比中樂透還難吧",
    "74,000我付得起但只有2人能上，這機率我不敢賭",
    "直接放棄，這活動設計根本沒打算讓人參與",
    "花了74,000還要跟737人搶2個位置，瘋了嗎",
    "暗影洛奇亞超想要的…但看到2個名額心直接涼了",
    "2/738 = 0.27%，這不是活動，這是樂透",
    "拜託管理員清醒一點，2個名額到底有什麼意義",
    "有人跟我一樣覺得這活動只是在刷存在感嗎",
    "這不是盲盒活動，這是絕望活動",
    "74,000丟水裡還比較快，至少不用等結果",
    "我已經放棄了，各位加油（0.27%的機率）",
    "名額2人然後700多人預報名？？到底在想什麼",
    "不用排了啦，2個名額擺明就是做做樣子",
    "738人裡面一定有內定，我們這些路人只是在陪榜",
    "暗影洛奇亞配布史上最難搶活動，沒有之一",
    "74,000的門檻 + 2個名額 = 史上最坑活動",
    "這活動誰想出來的，2個名額到底要辦給誰看",
    "連排隊都懶得排了，感覺就是浪費時間",
    "暗影洛奇亞很香，但2個名額讓我直接冷靜了",
    "如果這不是內定，那我就是寶可夢大師了",
    "738個韭菜陪2個天選之人演戲",
    "建議直接抽選然後公布名單，不要讓大家等",
    "74,000我可以拿去買10個盲盒了，幹嘛賭這個",
    "管理團隊到底在想什麼？2個名額是寫錯了嗎",
    "這機率比我色違遇到的機率還低，笑死",
    "暗影洛奇亞值得更好的對待，不是這種羞辱式活動",
    "各位醒醒，2個名額 + 700多人 = 你不是那個人",
    "已經對這活動不抱任何期待了，佛系看待",
    "74,000我寧願拿去買周邊，至少確定拿得到東西",
    "這大概是有史以來最絕望的Pokemon活動了",
    "738人陪審團，選出2個天選之人",
    "暗影洛奇亞一定很後悔被這樣對待",
    "不用想了，700多人搶2個，連轉蛋都不如",
    "建議管理團隊把活動下架，2個名額真的太羞辱人",
    "我已經刪除預報名了，浪費時間",
    "2/738，這不是機率，這是奇蹟",
    "暗影洛奇亞的配布等了這麼久，結果是這種活動…",
    "看到2個名額和700多人直接笑出來，管理團隊很有幽默感",
    "74,000的誠意 vs 700多人的現實，掰掰",
    "這活動唯一的用處就是讓我知道什麼叫絕望",
    "738人裡面取2人，感覺像是在選總統",
    "我決定把74,000省下來，這活動太沒誠意了",
    "暗影洛奇亞很棒，但這活動設計真的很糟糕",
    "2個名額辦什麼活動，私訊那兩個人就好啦",
    "不用排了不用排了，738人回家吧",
    "這不是盲盒活動，這是社會實驗",
    "預報名738人，然後呢？然後就沒有然後了",
    "74,000 + 2個名額 = 管理團隊的黑色幽默",
    "我已經看開了，這活動就是告訴你：你不是那個人",
    "暗影洛奇亞值得一個正常的活動，不是這個",
    "2個位置738人搶，連抽籤都覺得殘忍",
    "管理團隊拜託，2改成20好不好，至少給個希望",
    "這是我見過最令人沮喪的Pokemon活動頁面",
    "不用想了，2個位置一定早就被管理員朋友訂走了",
];

// 留言日期統一今天 5/2

interface Props {
    eventTitle?: string;
}

export default function EventComments({ eventTitle }: Props) {
    const comments = eventTitle?.includes("暗影洛奇亞")
        ? LUGIA_COMMENTS
        : SYLVEON_COMMENTS;

    const replies = eventTitle?.includes("暗影洛奇亞")
        ? LUGIA_REPLIES
        : SYLVEON_REPLIES;

    const staticComments = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        name: FAKE_NAMES[i],
        text: comments[i],
        time: "2026/5/5",
        replies: replies[i] || [],
    }));

    const hiddenLabel = `以下還有 130 則留言...`;
    const isLugia = eventTitle?.includes("暗影洛奇亞");
    const maxHeight = isLugia ? "max-h-[1400px]" : "max-h-[800px]";

    return (
        <div className="glass-card mt-8 p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
                <span>💬</span> 討論區
            </h3>
            
            <div className="relative">
                <div className={`space-y-4 ${maxHeight} overflow-hidden`}>
                    {staticComments.map(comment => (
                        <div key={comment.id}>
                            <div className="flex gap-3 animate-fade-in">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white/70">
                                    {comment.name.slice(0, 1)}
                                </div>
                                <div className="flex-1 rounded-2xl rounded-tl-none bg-white/5 px-4 py-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-white/80">{comment.name}</span>
                                        <span className="text-xs text-white/40">{comment.time}</span>
                                    </div>
                                    <p className="text-sm text-white/70">{comment.text}</p>
                                </div>
                            </div>
                            {/* 回覆串 */}
                            {comment.replies.length > 0 && (
                                <div className="ml-11 mt-1 space-y-2 border-l-2 border-white/10 pl-4">
                                    {comment.replies.map((reply, ri) => (
                                        <div key={ri} className="flex gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/50">
                                                {reply.name.slice(0, 1)}
                                            </div>
                                            <div className="flex-1 rounded-xl bg-white/[0.03] px-3 py-2">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-xs font-medium text-white/60">{reply.name}</span>
                                                    <span className="text-[10px] text-white/30">{reply.time}</span>
                                                </div>
                                                <p className="text-xs text-white/50">{reply.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 底部淡化遮罩 */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f172a] to-transparent flex items-end justify-center pb-2 pointer-events-none">
                    <span className="text-xs font-medium text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                        {hiddenLabel}
                    </span>
                </div>
            </div>

            {/* 假象留言輸入框與遮罩 */}
            <div className="relative mt-6">
                <div className="flex gap-3 opacity-40 blur-[1px] pointer-events-none">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white/70">
                        我
                    </div>
                    <div className="flex-1 flex items-center rounded-xl bg-white/5 px-4 py-2 border border-white/10">
                        <span className="text-sm text-white/40">新增留言...</span>
                    </div>
                    <button className="rounded-xl bg-blue-500/50 px-4 py-2 text-sm font-semibold text-white/50">
                        送出
                    </button>
                </div>
                
                {/* 遮罩層 */}
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-300/90 bg-black/60 px-4 py-2 rounded-full border border-amber-500/30 shadow-lg">
                        <span>🔒</span> 留言需群內成員資格
                    </div>
                </div>
            </div>
        </div>
    );
}
