import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { CRON_VIRTUAL_COMMENTS } from "@/lib/commentFallbackPool";

// 每次 Cron 執行時 shuffle 留言池，確保同一批次不重複
function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

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

        // Shuffle 留言池，依序取用確保不重複
        const shuffledComments = shuffleArray(CRON_VIRTUAL_COMMENTS);
        let commentPoolIndex = 0;

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

            // 隨機決定是否留言（30% 機率），且池中仍有未用過的留言
            if (Math.random() < 0.3 && commentPoolIndex < shuffledComments.length) {
                const commenter = shuffledVirtual[0]; // 用第一個訪客來留言
                const selectedComment = shuffledComments[commentPoolIndex++];

                comments.push({
                    profile_user_id: profile.id,
                    commenter_id: null,
                    virtual_commenter_id: commenter.id,
                    is_virtual: true,
                    content: selectedComment,
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

        // 7. 為有 ai_user_summary 的「重點用戶」每日生成一則 LLM 留言
        let llmCommentsAdded = 0;
        const { data: featuredProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, ai_user_summary, ai_system_prompt, bio")
            .not("ai_user_summary", "is", null);

        if (featuredProfiles && featuredProfiles.length > 0 && process.env.GEMINI_API_KEY) {
            for (const fp of featuredProfiles) {
                try {
                    // 取得該用戶的精選收藏（前 5 名）
                    const { data: topDists } = await supabase
                        .from("user_distributions")
                        .select("distributions(pokemon_name, points, is_shiny, event_name)")
                        .eq("user_id", fp.id)
                        .order("distributions(points)", { ascending: false })
                        .limit(5);

                    let collectionContext = "";
                    if (topDists && topDists.length > 0) {
                        const items = topDists.map((ud, i) => {
                            const d = Array.isArray(ud.distributions) ? ud.distributions[0] : ud.distributions;
                            if (!d) return null;
                            const dist = d as { pokemon_name: string; points?: number; is_shiny?: boolean; event_name?: string };
                            const parts: string[] = [];
                            if (dist.is_shiny) parts.push("✨色違");
                            if (dist.points) parts.push(`${dist.points}pts`);
                            if (dist.event_name) parts.push(dist.event_name);
                            const detail = parts.length > 0 ? `(${parts.join(", ")})` : "";
                            return `#${i + 1} ${dist.pokemon_name}${detail}`;
                        }).filter(Boolean);
                        if (items.length > 0) {
                            collectionContext = `精選收藏：${items.join(", ")}`;
                        }
                    }

                    // 呼叫 LLM API（用請求自己的 origin 來構建 URL）
                    const requestUrl = new URL(request.url);
                    const baseUrl = requestUrl.origin;

                    const llmRes = await fetch(`${baseUrl}/api/generate-homepage-comment`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            collectionContext,
                            userSummary: fp.ai_user_summary || fp.bio || "",
                        }),
                    });

                    if (llmRes.ok) {
                        const llmData = await llmRes.json();
                        if (llmData.reply) {
                            // 隨機選一個虛擬用戶作為留言者
                            const randomVirtual = virtualProfiles[Math.floor(Math.random() * virtualProfiles.length)];
                            const commentTime = new Date();
                            // 隨機設定為今天的某個時間（1-12 小時前）
                            commentTime.setHours(commentTime.getHours() - Math.floor(Math.random() * 12) - 1);

                            const { error: llmInsertErr } = await supabase
                                .from("profile_comments")
                                .insert({
                                    profile_user_id: fp.id,
                                    commenter_id: null,
                                    virtual_commenter_id: randomVirtual.id,
                                    is_virtual: true,
                                    content: llmData.reply,
                                    created_at: commentTime.toISOString(),
                                });

                            if (llmInsertErr) {
                                console.error(`LLM comment insert error for ${fp.full_name}:`, llmInsertErr);
                            } else {
                                llmCommentsAdded++;
                                console.log(`LLM comment added for ${fp.full_name}: "${llmData.reply}"`);
                            }
                        }
                    }
                } catch (llmErr) {
                    console.error(`LLM comment error for ${fp.full_name}:`, llmErr);
                }
            }
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
            message: `Added ${visits.length} visits, ${comments.length} comments, ${llmCommentsAdded} LLM comments, cleaned old records (7+ days)`,
            totalVisits: visits.length,
            totalComments: comments.length,
            llmComments: llmCommentsAdded,
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
