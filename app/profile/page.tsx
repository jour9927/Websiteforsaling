import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 未登入者導向登入頁
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  // 載入用戶資料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold">個人設定</h1>
        <p className="mt-2 text-sm text-slate-200/70">管理你的基本資料與通知偏好。</p>
      </section>

      <ProfileForm user={user} profile={profile} />
    </div>
  );
}
