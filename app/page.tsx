import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登入用戶顯示登入引導頁
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        <section className="glass-card max-w-lg p-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-200">Event Glass</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">個人空間</h1>
          <p className="mt-4 text-base text-slate-200">
            打造專屬你的收藏展示間，與社群成員互動交流。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              登入查看
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              立即註冊
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // 載入用戶資料
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 載入用戶的願望清單
  const { data: wishlists } = await supabase
    .from("wishlists")
    .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value)
    `)
    .eq("user_id", user.id)
    .order("priority", { ascending: false });

  // 載入用戶的留言
  const { data: comments } = await supabase
    .from("profile_comments")
    .select(`
      *,
      commenter:commenter_id (id, full_name)
    `)
    .eq("profile_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // 載入用戶收藏（用於精選展示）
  const { data: userItems } = await supabase
    .from("user_items")
    .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value, series_tag)
    `)
    .eq("user_id", user.id);

  // 載入所有可願望的活動
  const { data: allEvents } = await supabase
    .from("events")
    .select("id, title, image_url, visual_card_url, estimated_value")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <PersonalSpaceContent
      user={user}
      profile={profile}
      wishlists={wishlists || []}
      comments={comments || []}
      userItems={userItems || []}
      allEvents={allEvents || []}
      isOwnProfile={true}
    />
  );
}
