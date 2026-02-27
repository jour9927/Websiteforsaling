"use client";

import { useState, useEffect } from "react";

const FAKE_NAMES = [
    "王**", "李**", "張**", "陳**", "林**", "黃**", "吳**", "周**",
    "謝**", "趙**", "徐**", "馬**", "朱**", "胡**", "高**", "羅**",
    "L***", "T***", "K***", "M***", "S***", "A***", "J***", "W***",
    "色違獵人", "孵蛋廢人", "圖鑑收集狂", "搶標新手", "潛水路人", "小資族玩家"
];

// 針對「卡在49人、報名失敗」的 Bug 假象留言
const BUG_COMMENTS = [
    "奇怪，我按報名一直轉圈圈，有人跟我一樣嗎？",
    "卡在 49 人好久了，是系統壞了嗎？",
    "剩最後一個名額，但我點了沒反應 😭",
    "換了瀏覽器還是報名失敗，求救！",
    "是不是已經滿了只是數字沒更新啊？",
    "剛剛問管理員，好像是同時太多人點卡住了",
    "有沒有人搶到最後一個名額啊？",
    "我點進去顯示錯誤代碼500...",
    "太扯了吧，我守在螢幕前還是點不進去",
    "有人成功報名到第50個嗎？",
    "一直顯示處理中，到底有沒有成功啦",
    "這隻仙子伊布太熱門了吧，伺服器直接被塞爆",
    "我朋友說他剛剛點進去也是白畫面",
    "到底誰搶到了啦 出來面對",
    "看來是無緣了，系統完全卡死"
];

export default function EventComments() {
    const [comments, setComments] = useState<{ id: number; name: string; text: string; time: string }[]>([]);
    const [hiddenCount, setHiddenCount] = useState(0);

    useEffect(() => {
        setHiddenCount(Math.floor(Math.random() * 40) + 120); // 隨機產生 120~160 則隱藏留言

        // 為了避免重複，我們需要追蹤已經使用過的留言和名字
        const usedNames = new Set<string>();
        const usedComments = new Set<string>();

        const getRandomUnique = (array: string[], usedSet: Set<string>) => {
            // 如果所有選項都用過了，就清空重新開始
            if (usedSet.size >= array.length) {
                usedSet.clear();
            }
            
            const available = array.filter(item => !usedSet.has(item));
            const selected = available[Math.floor(Math.random() * available.length)];
            usedSet.add(selected);
            return selected;
        };

        // 初始載入 8 則留言
        const initialCount = 8;
        const initialComments = Array.from({ length: initialCount }).map((_, i) => ({
            id: Date.now() - i * 100000,
            name: getRandomUnique(FAKE_NAMES, usedNames),
            text: getRandomUnique(BUG_COMMENTS, usedComments),
            time: `${Math.floor(Math.random() * 10) + 1}分鐘前`
        }));
        setComments(initialComments);

        // 每 15-30 秒新增一則留言，同時更新隱藏數
        let timer: ReturnType<typeof setTimeout>;
        const scheduleNext = () => {
            timer = setTimeout(() => {
                const newComment = {
                    id: Date.now(),
                    name: getRandomUnique(FAKE_NAMES, usedNames),
                    text: getRandomUnique(BUG_COMMENTS, usedComments),
                    time: "剛剛"
                };
                setComments(prev => [newComment, ...prev].slice(0, 8));
                setHiddenCount(prev => prev + Math.floor(Math.random() * 3) + 1);
                scheduleNext(); // 排下一輪
            }, 15000 + Math.random() * 15000);
        };
        scheduleNext();

        return () => clearTimeout(timer);
    }, []);

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
                        以下還有 {hiddenCount} 則留言...
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
