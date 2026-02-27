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
    "剛剛問客服，好像是同時太多人點卡住了",
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

    useEffect(() => {
        // 初始載入 4-6 則留言
        const initialCount = Math.floor(Math.random() * 3) + 4;
        const initialComments = Array.from({ length: initialCount }).map((_, i) => ({
            id: Date.now() - i * 100000,
            name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
            text: BUG_COMMENTS[Math.floor(Math.random() * BUG_COMMENTS.length)],
            time: `${Math.floor(Math.random() * 10) + 1}分鐘前`
        }));
        setComments(initialComments);

        // 每 15-30 秒新增一則留言
        const interval = setInterval(() => {
            setComments(prev => {
                const newComment = {
                    id: Date.now(),
                    name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
                    text: BUG_COMMENTS[Math.floor(Math.random() * BUG_COMMENTS.length)],
                    time: "剛剛"
                };
                return [newComment, ...prev].slice(0, 8); // 最多保留 8 則
            });
        }, 15000 + Math.random() * 15000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card mt-8 p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
                <span>💬</span> 討論區
                <span className="text-xs font-normal text-white/50 ml-2">即時更新中...</span>
            </h3>
            
            <div className="space-y-4">
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
        </div>
    );
}
