import { createServerSupabaseClient } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
    const { id: userId } = await params;
    const supabase = createServerSupabaseClient();

    // 取得當前登入用戶
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    // 載入目標用戶資料
    const { data: targetProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (!targetProfile) {
        notFound();
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
        />
    );
}
