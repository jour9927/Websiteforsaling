import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// GET: 獲取關注列表
export async function GET(request: Request) {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const virtualId = searchParams.get("virtualId");
    const type = searchParams.get("type"); // "followers" 或 "following"

    if (!userId && !virtualId) {
        return NextResponse.json({ error: "需要 userId 或 virtualId" }, { status: 400 });
    }

    if (!type || !["followers", "following"].includes(type)) {
        return NextResponse.json({ error: "type 必須是 followers 或 following" }, { status: 400 });
    }

    try {
        if (type === "followers") {
            // 查詢誰關注了這個用戶
            let query;
            if (userId) {
                query = supabase
                    .from("follows")
                    .select("follower_id, created_at")
                    .eq("followed_user_id", userId)
                    .order("created_at", { ascending: false });
            } else {
                query = supabase
                    .from("follows")
                    .select("follower_id, created_at")
                    .eq("followed_virtual_id", virtualId)
                    .order("created_at", { ascending: false });
            }

            const { data: follows, error } = await query;
            if (error) throw error;

            // 獲取關注者的詳細信息
            const followerIds = follows?.map(f => f.follower_id) || [];
            if (followerIds.length === 0) {
                return NextResponse.json({ list: [] });
            }

            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, username")
                .in("id", followerIds);

            const list = followerIds.map(id => {
                const profile = profiles?.find(p => p.id === id);
                return {
                    id,
                    displayName: profile?.full_name || profile?.username || "用戶",
                    username: profile?.username,
                    isVirtual: false
                };
            });

            return NextResponse.json({ list });
        } else {
            // 查詢這個用戶關注了誰（只有真實用戶才能關注）
            if (!userId) {
                return NextResponse.json({ list: [] }); // 虛擬用戶沒有 following
            }

            const { data: follows, error } = await supabase
                .from("follows")
                .select("followed_user_id, followed_virtual_id, created_at")
                .eq("follower_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const list: Array<{
                id: string;
                displayName: string;
                username?: string;
                isVirtual: boolean;
            }> = [];

            // 分別處理真實用戶和虛擬用戶
            const realUserIds = follows?.filter(f => f.followed_user_id).map(f => f.followed_user_id) || [];
            const virtualUserIds = follows?.filter(f => f.followed_virtual_id).map(f => f.followed_virtual_id) || [];

            if (realUserIds.length > 0) {
                const { data: realProfiles } = await supabase
                    .from("profiles")
                    .select("id, full_name, username")
                    .in("id", realUserIds);

                realProfiles?.forEach(p => {
                    list.push({
                        id: p.id,
                        displayName: p.full_name || p.username || "用戶",
                        username: p.username,
                        isVirtual: false
                    });
                });
            }

            if (virtualUserIds.length > 0) {
                const { data: virtualProfiles } = await supabase
                    .from("virtual_profiles")
                    .select("id, display_name")
                    .in("id", virtualUserIds);

                virtualProfiles?.forEach(p => {
                    list.push({
                        id: p.id,
                        displayName: p.display_name,
                        isVirtual: true
                    });
                });
            }

            return NextResponse.json({ list });
        }
    } catch (error) {
        console.error("Get follow list error:", error);
        return NextResponse.json({ error: "獲取列表失敗" }, { status: 500 });
    }
}
