import { createServerSupabaseClient } from "@/lib/auth";
import { notFound } from "next/navigation";
import CommissionDetailClient from "./CommissionDetailClient";

export const dynamic = "force-dynamic";

interface CommissionPageProps {
  params: { id: string };
}

export default async function CommissionDetailPage({ params }: CommissionPageProps) {
  const supabase = createServerSupabaseClient();

  const { data: commission, error } = await supabase
    .from("commissions")
    .select(
      `*,
       distributions(id, pokemon_name, pokemon_name_en, pokemon_sprite_url, pokemon_dex_number, generation, points, game_titles, original_trainer, distribution_method, region, is_shiny),
       poster:profiles!commissions_poster_id_fkey(id, full_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name, avatar_seed),
       executor:profiles!commissions_executor_id_fkey(id, full_name),
       executor_virtual:virtual_profiles!commissions_executor_virtual_id_fkey(id, display_name, avatar_seed),
       commission_deposits(id, deposit_pokemon_name, deposit_pokemon_value, status, return_eligible_at, returned_at)`
    )
    .eq("id", params.id)
    .single();

  if (error || !commission) {
    notFound();
  }

  // 隱藏虛擬用戶身份：統一為 poster / executor
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const c = commission as any;
  const rawPoster = c.poster_type === "virtual" ? c.poster_virtual : c.poster;
  const poster = rawPoster ? { id: rawPoster.id, display_name: rawPoster.display_name || rawPoster.full_name || "匿名" } : null;
  const rawExecutor = c.executor_type === "virtual" ? c.executor_virtual : c.executor;
  const executor = rawExecutor ? { id: rawExecutor.id, display_name: rawExecutor.display_name || rawExecutor.full_name || "匿名" } : null;
  const hideKeys = ["poster_type", "poster_virtual", "executor_type", "executor_virtual", "poster_virtual_id", "executor_virtual_id", "admin_review_note", "reviewed_by"];
  const cleaned = Object.fromEntries(Object.entries(c).filter(([k]) => !hideKeys.includes(k)));
  const sanitized = { ...cleaned, poster, executor };

  // 取得目前使用者
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CommissionDetailClient
      commission={sanitized}
      currentUserId={user?.id || null}
    />
  );
}
