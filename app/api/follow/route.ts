import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET: 獲取關注狀態和統計
export async function GET(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const virtualId = searchParams.get("virtualId");

    if (!userId && !virtualId) {
        return NextResponse.json({ error: "需要 userId 或 virtualId" }, { status: 400 });
    }

    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();

    // 獲取關注統計
    let stats = { followers_count: 0, following_count: 0, popularity_score: 0 };
    let isFollowing = false;

    if (userId) {
        // 真實用戶
        const { data: profile } = await supabase
            .from("profiles")
            .select("followers_count, following_count, popularity_score")
            .eq("id", userId)
            .single();

        if (profile) {
            stats = {
                followers_count: profile.followers_count || 0,
                following_count: profile.following_count || 0,
                popularity_score: profile.popularity_score || 0
            };
        }

        // 檢查當前用戶是否已關注
        if (user) {
            const { data: follow } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", user.id)
                .eq("followed_user_id", userId)
                .single();
            isFollowing = !!follow;
        }
    } else if (virtualId) {
        // 虛擬用戶
        const { data: profile } = await supabase
            .from("virtual_profiles")
            .select("followers_count, popularity_score")
            .eq("id", virtualId)
            .single();

        if (profile) {
            stats = {
                followers_count: profile.followers_count || 0,
                following_count: 0,
                popularity_score: profile.popularity_score || 0
            };
        }

        // 檢查是否已關注
        if (user) {
            const { data: follow } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", user.id)
                .eq("followed_virtual_id", virtualId)
                .single();
            isFollowing = !!follow;
        }
    }

    return NextResponse.json({
        ...stats,
        isFollowing,
        isLoggedIn: !!user
    });
}

// POST: 關注或取消關注
export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    // 驗證登入
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, virtualId, action } = body;

    if (!userId && !virtualId) {
        return NextResponse.json({ error: "需要 userId 或 virtualId" }, { status: 400 });
    }

    // 不能關注自己
    if (userId === user.id) {
        return NextResponse.json({ error: "不能關注自己" }, { status: 400 });
    }

    try {
        if (action === "unfollow") {
            // 取消關注
            if (userId) {
                await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("followed_user_id", userId);

                // 更新計數
                await supabase.rpc("decrement_follow_count", {
                    follower: user.id,
                    followed: userId
                }).catch(() => {
                    // 手動更新
                    supabase.from("profiles").update({
                        following_count: supabase.rpc("greatest", { a: 0, b: "following_count - 1" })
                    }).eq("id", user.id);
                });
            } else {
                await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("followed_virtual_id", virtualId);
            }

            return NextResponse.json({ success: true, action: "unfollowed" });
        } else {
            // 關注
            const insertData = userId
                ? { follower_id: user.id, followed_user_id: userId }
                : { follower_id: user.id, followed_virtual_id: virtualId };

            const { error } = await supabase
                .from("follows")
                .insert(insertData);

            if (error) {
                if (error.code === "23505") {
                    return NextResponse.json({ error: "已經關注過了" }, { status: 400 });
                }
                throw error;
            }

            // 更新計數 - 真實用戶
            if (userId) {
                await supabase
                    .from("profiles")
                    .update({ following_count: supabase.rpc("increment") as unknown as number })
                    .eq("id", user.id);
                await supabase
                    .from("profiles")
                    .update({ followers_count: supabase.rpc("increment") as unknown as number })
                    .eq("id", userId);
            } else {
                // 虛擬用戶只更新 followers_count
                await supabase
                    .from("profiles")
                    .update({ following_count: supabase.rpc("increment") as unknown as number })
                    .eq("id", user.id);
                await supabase
                    .from("virtual_profiles")
                    .update({ followers_count: supabase.rpc("increment") as unknown as number })
                    .eq("id", virtualId);
            }

            return NextResponse.json({ success: true, action: "followed" });
        }
    } catch (error) {
        console.error("Follow error:", error);
        return NextResponse.json({ error: "操作失敗" }, { status: 500 });
    }
}
