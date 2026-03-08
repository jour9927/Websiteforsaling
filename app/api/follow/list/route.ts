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
            // 查詢誰關注了這個用戶（真實關注記錄）
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

            // 獲取真實關注者的詳細信息
            const followerIds = follows?.map(f => f.follower_id) || [];
            const list: Array<{
                id: string;
                displayName: string;
                username?: string;
                isVirtual: boolean;
            }> = [];

            if (followerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, full_name, username")
                    .in("id", followerIds);

                followerIds.forEach(id => {
                    const profile = profiles?.find(p => p.id === id);
                    list.push({
                        id,
                        displayName: profile?.full_name || profile?.username || "用戶",
                        username: profile?.username,
                        isVirtual: false
                    });
                });
            }

            // 如果真實粉絲不夠，補上虛擬粉絲（對應 followers_count 灌水數據）
            const targetId = userId || virtualId || "";
            if (list.length < 3) {
                const { data: allVirtualProfiles } = await supabase
                    .from("virtual_profiles")
                    .select("id, display_name")
                    .limit(30);

                if (allVirtualProfiles && allVirtualProfiles.length > 0) {
                    // 確定性 hash：同一用戶每次看到相同的虛擬粉絲
                    let hash = 0;
                    for (let i = 0; i < targetId.length; i++) {
                        hash = ((hash << 5) - hash) + targetId.charCodeAt(i);
                        hash |= 0;
                    }
                    hash = Math.abs(hash);

                    // 虛擬用戶補更多假粉絲（5-15位），真實用戶補到 3-8 位
                    const minFollowers = virtualId ? 5 : 3;
                    const extraRange = virtualId ? 11 : 6;
                    const needed = (minFollowers + (hash % extraRange)) - list.length;

                    // 排除自己（避免虛擬用戶自己出現在自己的粉絲列表中）
                    const filteredProfiles = allVirtualProfiles.filter(vp => vp.id !== virtualId);

                    const shuffled = [...filteredProfiles].sort((a, b) => {
                        const ha = Math.abs(Math.sin(hash * a.id.charCodeAt(0) + a.id.charCodeAt(1)) * 10000);
                        const hb = Math.abs(Math.sin(hash * b.id.charCodeAt(0) + b.id.charCodeAt(1)) * 10000);
                        return ha - hb;
                    });

                    shuffled.slice(0, Math.max(0, needed)).forEach(vp => {
                        list.push({
                            id: vp.id,
                            displayName: vp.display_name,
                            isVirtual: true
                        });
                    });
                }
            }

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
