import { redirect } from "next/navigation";
import { GameRewardExchange } from "@/components/GameRewardExchange";
import { createServerSupabaseClient } from "@/lib/auth";
import { STORE_REBATE_REWARDS } from "@/lib/rewardExchange";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/rewards");
  }

  return <GameRewardExchange initialRewards={STORE_REBATE_REWARDS} />;
}
