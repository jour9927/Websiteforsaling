import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import RouletteGame from "@/components/games/RouletteGame";

export const dynamic = "force-dynamic";

export default async function RoulettePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 取得使用者資料，包含 lottery_tickets 抽獎券
  const { data: profile } = await supabase
    .from("profiles")
    .select("fortune_points, lottery_tickets")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
          🎡 時光輪盤
        </h1>
        <p className="text-center text-slate-300 mt-2">
          消耗 1 張抽獎券，有機會獲得高額點數或其他驚喜！
        </p>
      </div>

      <RouletteGame 
        initialTickets={profile?.lottery_tickets || 0}
        initialPoints={profile?.fortune_points || 0}
      />
    </div>
  );
}
