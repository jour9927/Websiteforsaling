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

// 針對「葉伊布排除盲盒」的假象留言 — 名額極少引發怨言
const BUG_COMMENTS = [
    "382人搶15個名額…這機率比色違還低吧",
    "排除2隻還OK啦，但15個名額是認真的嗎？",
    "管理員拜託加開名額，才15人是要大家打架嗎 😭",
    "300多人搶15個位置？？？管理團隊擺明不想讓人用卷吧",
    "葉伊布欸！！拜託讓我抽到正式資格 🙏",
    "我以為預報名就等於報到了，結果還要排隊等審核",
    "排除系統不錯但名額真的太少了啦",
    "15個名額382人搶…這比大學錄取率還低",
    "排除2隻不夠用啊，我想要的葉伊布是特定個體欸",
    "5/25當天一定會塞爆，我先預報名壓壓驚",
    "有沒有人知道審核標準是什麼？先報先審嗎",
    "葉伊布配布終於來了！但這名額數…我先哭一下",
    "一人一推拜託管理員加開名額 🙏🙏🙏",
    "已經預報名了，現在每天祈禱被選中",
    "排除系統真的佛，但15個名額建議直接樂透抽選",
    "382人搶15個，機率不到4%，比手遊SSR還難抽",
    "這活動讓我想到抽選制演唱會，又愛又恨",
    "管理員說預報名不等於成功，那到底怎麼篩人啊",
    "一人只能排一個嗎？還是我可以開小號搶",
    "拜託讓我中…這輩子沒這麼想當那15人之一",
    "排除兩隻至少要排除葉伊布的進化前型態吧",
    "感覺這活動會變成傳說中的0.04%地獄",
    "有人跟我一樣現在才發現有這活動嗎？來不及了吧",
    "5/25當天會公布結果嗎？好緊張",
    "葉伊布的死忠粉站出來！雖然只有15個名額…",
    "希望審核是公平的，不要有內定 😤",
    "我已經把排除清單列好了，就差被選中了",
    "才15個名額，這種飢餓行銷我給過 🥲",
    "如果沒中我可能會難過一個禮拜",
    "大家冷靜，15個裡面說不定早就有內定了（開玩笑的）",
    "這活動從預報名到正式名單等好久，煎熬啊",
    "排除兩隻真的太少了，至少給排除五隻吧",
    "我已經準備好NT$9999了，拜託選我",
    "382人真的太誇張了，要不要直接抽選制啊",
    "隔壁仙子伊布盲盒50盒欸，我們葉伊布怎麼差這麼多",
    "管理員說不定會在5/25當天加碼！我繼續等",
    "這是我這輩子第一次這麼想當那4%的人",
    "葉伊布超可愛的，15個名額真的會暴動",
    "已經號召朋友一起預報名了，人多力量大（？",
    "有沒有可能有人報了但沒付錢所以釋出名額啊",
    "5/25倒數中…每天醒來第一件事就是刷這頁",
    "排除機制很聰明但能不能先多開一點名額 😫",
    "15個名額排382人，我不敢想像當天的混亂場面",
    "這比任何配布活動都難搶，葉伊布真的好紅",
    "建議管理員名額加到30以上啦，15真的太少了",
    "如果要花9999還要排隊，感覺比盲盒還競爭",
    "求求老天爺讓我中，我願意用一箱色違交換",
    "預報名的人數還在增加！這活動也太夯了",
    "聽說有些人已經在討論要不要聯合抗議名額太少",
    "希望管理員能看到大家的心聲，名額真的太少了…",
    "我已經備好排除清單和扣打了，就等5/25到來",
    "排除兩隻這個設計很貼心，但15名額真的母湯",
    "這大概是我參加過最難搶的Pokemon活動了",
    "認真覺得應該要50個名額才合理，15太誇張",
    "如果這次沒中，下次活動我一定第一個報到",
    "葉伊布排除盲盒這個概念太酷了，可惜名額太少",
    "管理員大人，拜託聽到382人的心聲好嗎 🥺",
    "5/25那天我請假在家守著，一定要搶到",
    "聽說有人已經找了代搶服務，這也太競爭了",
    "15個名額可以理解啦，但為什麼不能擴充一下",
];

// 葉伊布活動留言日期（活動前幾週，今天 5/2）
const COMMENT_DATES = [
    "2026/4/25", "2026/4/26", "2026/4/27", "2026/4/28", "2026/4/28",
    "2026/4/29", "2026/4/29", "2026/4/30", "2026/4/30", "2026/5/1",
    "2026/5/1", "2026/5/1", "2026/5/2", "2026/5/2", "2026/5/2",
    "2026/5/2", "2026/5/2", "2026/5/2", "2026/5/2", "2026/5/2",
    "2026/5/2", "2026/5/2", "2026/5/2", "2026/5/2", "2026/5/2",
    "2026/5/2", "2026/5/2", "2026/5/2", "2026/5/2", "2026/5/2",
];

const HIDDEN_LABEL = `以下還有 ${BUG_COMMENTS.length - 8} 則留言...`;

const STATIC_COMMENTS = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    name: FAKE_NAMES[i],
    text: BUG_COMMENTS[i],
    time: COMMENT_DATES[i]
}));

export default function EventComments() {
    const comments = STATIC_COMMENTS;

    return (
        <div className="glass-card mt-8 p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
                <span>💬</span> 討論區
            </h3>
            
            <div className="relative">
                <div className="space-y-4 max-h-[520px] overflow-hidden">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 animate-fade-in">
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
                    ))}
                </div>

                {/* 底部淡化遮罩 */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f172a] to-transparent flex items-end justify-center pb-2 pointer-events-none">
                    <span className="text-xs font-medium text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                        {HIDDEN_LABEL}
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
