import { createServerSupabaseClient } from "@/lib/auth";
import PokedexContent from "@/components/PokedexContent";

export default async function PokedexPage() {
    const supabase = createServerSupabaseClient();

    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();

    // 獲取所有配布資料
    const { data: distributions } = await supabase
        .from("distributions")
        .select("*")
        .order("distribution_period_start", { ascending: false });

    // 獲取用戶已收集的配布
    let userCollected: string[] = [];
    if (user) {
        const { data: userDistributions } = await supabase
            .from("user_distributions")
            .select("distribution_id")
            .eq("user_id", user.id);

        userCollected = userDistributions?.map(d => d.distribution_id as string) || [];
    }

    // 按世代分組
    const distributionsByGen = (distributions || []).reduce((acc, dist) => {
        const gen = dist.generation || 9;
        if (!acc[gen]) acc[gen] = [];
        acc[gen].push(dist);
        return acc;
    }, {} as Record<number, typeof distributions>);

    return (
        <PokedexContent
            distributions={distributions || []}
            distributionsByGen={distributionsByGen}
            userCollected={userCollected}
            isLoggedIn={!!user}
            userId={user?.id}
        />
    );
}
