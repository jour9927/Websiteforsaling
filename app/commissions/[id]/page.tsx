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
       poster:profiles!commissions_poster_id_fkey(id, display_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name, avatar_seed),
       executor:profiles!commissions_executor_id_fkey(id, display_name),
       executor_virtual:virtual_profiles!commissions_executor_virtual_id_fkey(id, display_name, avatar_seed),
       commission_deposits(id, deposit_pokemon_name, deposit_pokemon_value, status, return_eligible_at, returned_at)`
    )
    .eq("id", params.id)
    .single();

  if (error || !commission) {
    notFound();
  }

  // 取得目前使用者
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CommissionDetailClient
      commission={commission}
      currentUserId={user?.id || null}
    />
  );
}
