import { createServerSupabaseClient } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>;
};

// 檢查是否為 UUID 格式
function isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default async function UserProfilePage({ params }: Props) {
    const { id: idOrUsername } = await params;
    const supabase = createServerSupabaseClient();

    // 取得當前登入用戶
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    // 根據 UUID 或 username 查詢目標用戶
    let targetProfile;
    if (isUUID(idOrUsername)) {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", idOrUsername)
            .single();
        targetProfile = data;
    } else {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", idOrUsername.toLowerCase())
            .single();
        targetProfile = data;
    }

    if (!targetProfile) {
        notFound();
    }

    const userId = targetProfile.id;

    // 記錄訪問（如果是登入用戶且不是訪問自己）
    if (currentUser && currentUser.id !== userId) {
        // 更新訪問統計
        const today = new Date().toISOString().split('T')[0];

        // 檢查是否需要重置今日訪問數
        if (targetProfile.last_view_reset !== today) {
            await supabase
                .from("profiles")
                .update({
                    today_views: 1,
                    total_views: (targetProfile.total_views || 0) + 1,
                    last_view_reset: today
                })
                .eq("id", userId);
        } else {
            await supabase
                .from("profiles")
                .update({
                    today_views: (targetProfile.today_views || 0) + 1,
                    total_views: (targetProfile.total_views || 0) + 1
                })
                .eq("id", userId);
        }

        // 記錄訪客（用於顯示最近訪客頭像）
        await supabase
            .from("profile_visits")
            .upsert({
                profile_user_id: userId,
                visitor_id: currentUser.id,
                visited_at: new Date().toISOString(),
            }, {
                onConflict: 'profile_user_id,visitor_id'
            });
    }

    // 載入目標用戶的願望清單
    const { data: wishlists } = await supabase
        .from("wishlists")
        .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value)
    `)
        .eq("user_id", userId)
        .order("priority", { ascending: false });

    // 載入目標用戶的留言
    const { data: comments } = await supabase
        .from("profile_comments")
        .select(`
      *,
      commenter:commenter_id (id, full_name)
    `)
        .eq("profile_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

    // 載入目標用戶收藏
    const { data: userItems } = await supabase
        .from("user_items")
        .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value, series_tag)
    `)
        .eq("user_id", userId);

    // 載入所有可願望的活動（如果是自己的頁面才需要）
    const { data: allEvents } = await supabase
        .from("events")
        .select("id, title, image_url, visual_card_url, estimated_value")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    // 載入最近訪客（最多 10 位）
    const { data: recentVisitors } = await supabase
        .from("profile_visits")
        .select(`
            visitor:visitor_id (id, full_name, username)
        `)
        .eq("profile_user_id", userId)
        .order("visited_at", { ascending: false })
        .limit(10);

    // 建立虛擬用戶物件給 PersonalSpaceContent
    const targetUser = {
        id: userId,
        email: targetProfile.email || undefined,
    };

    const isOwnProfile = currentUser?.id === userId;

    return (
        <PersonalSpaceContent
            user={targetUser}
            profile={targetProfile}
            wishlists={wishlists || []}
            comments={comments || []}
            userItems={userItems || []}
            allEvents={allEvents || []}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUser?.id}
            recentVisitors={
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (recentVisitors?.map((v: any) => v.visitor).filter(Boolean) || []) as any
            }
        />
    );
}
