import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 虛擬留言池（80+ 條，分類：讚美、羨慕、提問、打招呼、閒聊、遊戲相關、收藏討論）
const VIRTUAL_COMMENTS = [
    // ── 讚美系 ──
    "收藏好漂亮！🌟",
    "太強了吧這收藏！",
    "收藏真的太讚了！",
    "收藏家 respect 🫡",
    "你的頁面好好看 ✨",
    "每次來都覺得好厲害",
    "這品味也太好了吧！",
    "佈置得好用心 💕",
    "哇這個陣容太華麗了",
    "收藏量驚人！膜拜中 🙇",
    "看到你的收藏就覺得開心",
    "真的是寶可夢大師等級！",
    "神級收藏 respect！",
    "每張卡都好漂亮 🥹",
    "排列得好整齊好療癒",
    // ── 羨慕系 ──
    "好羨慕你的收藏",
    "真羨慕你的收藏量！",
    "你的願望清單我都想要 😂",
    "天哪 我什麼時候能有這種收藏",
    "看到好羨慕，我也想開始收",
    "這陣容...眼淚流下來 😭",
    "有夠羨慕的啦！",
    "哭了，為什麼你什麼都有",
    "羨慕到說不出話",
    "我的收藏跟你比起來好寒酸 😂",
    "這是什麼神仙收藏！",
    "好想擁有你的收藏清單喔",
    // ── 提問系 ──
    "什麼時候再上新的？",
    "可以交流一下嗎？",
    "請問這張是在哪裡入手的？",
    "這系列還有出其他的嗎？",
    "想問一下你都怎麼保存卡片的？",
    "有推薦的卡套品牌嗎？",
    "這張是日版還是英版啊？",
    "想知道你最喜歡哪一張？",
    "你是從什麼時候開始收的？",
    "有在考慮賣嗎？（試探 😂）",
    "最近的新品你有預購嗎？",
    "你的收藏有保險嗎 哈哈",
    // ── 打招呼 / 路過系 ──
    "路過留言～",
    "來逛逛！",
    "每日報到 ✅",
    "嗨嗨～來看看你的新收藏",
    "晃過來打個招呼👋",
    "簽到～",
    "又來偷看你的收藏了 👀",
    "今天也來學習了！",
    "定期朝聖 🙏",
    "經過留個腳印～",
    "日常巡邏到此一遊",
    "來跟大佬請安了",
    // ── 閒聊系 ──
    "大佬帶帶我 🙏",
    "新手報到！學習中 📚",
    "剛入坑的新人來學習了",
    "這個配布我也有！",
    "最近好多新品 錢包在哭",
    "我錢包不允許我看你的收藏 💸",
    "又是被燒到的一天",
    "看完又想下單了怎麼辦",
    "忍住...我不能再買了...",
    "好想回到以前卡片還便宜的日子",
    "月底了還是忍不住上來看",
    "早安！新的一天從看卡開始",
    "晚安留言～明天見",
    "放假第一件事就是逛這裡",
    "你讓我的願望清單又變長了 😅",
    "看你的收藏是我的精神糧食",
    "每次看都有新發現",
    // ── 遊戲 / 動畫相關 ──
    "最近朱紫 DLC 你玩了嗎？",
    "你有玩集換式卡牌遊戲嗎？",
    "期待你的新增收藏 👀",
    "有在追最新的動畫嗎？",
    "寶可夢真的是永遠的神",
    "小時候就開始玩了 滿滿回憶",
    "最近重溫金銀 還是那麼好玩",
    "你有去寶可夢中心嗎？",
    "日本的寶可夢中心好讚",
    "TCG Pocket 最近超好玩的",
    // ── 收藏討論系 ──
    "這張卡的狀態保持得好好！",
    "包裝都還在 太用心了吧",
    "你有用防潮箱嗎？",
    "我也想開始認真整理收藏了",
    "看到你的收藏讓我也想曬一波",
    "配布的品質真的沒話說",
    "你會評級嗎？感覺可以送 PSA",
    "收藏果然還是要完整一套才爽",
    "補齊一整套的感覺超讚吧",
    "這收藏傳給下一代都可以了",
];

export async function GET(request: NextRequest) {
    // 驗證 cron secret（未設定 CRON_SECRET 時也拒絕，防止未授權觸發）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 使用 service role key 來繞過 RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. 獲取所有真實用戶
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .limit(100);

        if (profilesError) throw profilesError;
        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ message: "No profiles found" });
        }

        // 2. 獲取所有虛擬用戶（用來當訪客和留言者）
        const { data: virtualProfiles, error: virtualError } = await supabase
            .from("virtual_profiles")
            .select("id, display_name");

        if (virtualError) throw virtualError;
        if (!virtualProfiles || virtualProfiles.length === 0) {
            return NextResponse.json({ message: "No virtual profiles found" });
        }

        // 3. 為每個用戶添加虛擬訪問和留言
        const now = new Date();
        const visits = [];
        const comments = [];
        const viewUpdates = [];

        for (const profile of profiles) {
            // 隨機決定這個用戶今天獲得多少虛擬訪問（1-5）
            const visitCount = Math.floor(Math.random() * 5) + 1;

            // 從虛擬用戶中隨機選擇不重複的訪客
            const shuffledVirtual = [...virtualProfiles].sort(() => Math.random() - 0.5);
            const selectedVisitors = shuffledVirtual.slice(0, visitCount);

            for (const visitor of selectedVisitors) {
                visits.push({
                    profile_user_id: profile.id,
                    visitor_id: null,
                    virtual_visitor_id: visitor.id,
                    is_virtual: true,
                    visited_at: now.toISOString(),
                });
            }

            // 隨機決定是否留言（30% 機率）
            if (Math.random() < 0.3) {
                const commenter = shuffledVirtual[0]; // 用第一個訪客來留言
                const randomComment = VIRTUAL_COMMENTS[Math.floor(Math.random() * VIRTUAL_COMMENTS.length)];

                comments.push({
                    profile_user_id: profile.id,
                    commenter_id: null,
                    virtual_commenter_id: commenter.id,
                    is_virtual: true,
                    content: randomComment,
                    created_at: now.toISOString(),
                });
            }

            viewUpdates.push({
                id: profile.id,
                addViews: selectedVisitors.length,
            });
        }

        // 4. 批次插入訪問記錄
        const { error: visitError } = await supabase
            .from("profile_visits")
            .upsert(visits, {
                onConflict: "profile_user_id,virtual_visitor_id",
                ignoreDuplicates: true
            });

        if (visitError) {
            console.error("Visit insert error:", visitError);
        }

        // 5. 批次插入留言
        if (comments.length > 0) {
            const { error: commentError } = await supabase
                .from("profile_comments")
                .insert(comments);

            if (commentError) {
                console.error("Comment insert error:", commentError);
            }
        }

        // 6. 更新每個用戶的 view 計數
        for (const update of viewUpdates) {
            await supabase.rpc("increment_profile_views", {
                profile_id: update.id,
                add_views: update.addViews,
            });
        }

        // 7. 重置今日訪問（如果是上午 11:00）
        const hour = now.getHours();
        if (hour === 11) {
            await supabase
                .from("profiles")
                .update({ today_views: 0 })
                .neq("id", "00000000-0000-0000-0000-000000000000");
        }

        // 8. 清理 7 天以上的虛擬留言（跳過有真實回覆的討論串）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await supabase
            .from("profile_comments")
            .delete()
            .eq("is_virtual", true)
            .eq("has_real_reply", false) // 跳過有真實回覆的討論串
            .is("parent_id", null) // 只刪除頂層留言（子留言會 CASCADE 刪除）
            .lt("created_at", sevenDaysAgo.toISOString());

        await supabase
            .from("profile_visits")
            .delete()
            .eq("is_virtual", true)
            .lt("visited_at", sevenDaysAgo.toISOString());

        return NextResponse.json({
            success: true,
            message: `Added ${visits.length} visits and ${comments.length} comments, cleaned old records (7+ days)`,
            totalVisits: visits.length,
            totalComments: comments.length,
            timestamp: now.toISOString(),
        });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
