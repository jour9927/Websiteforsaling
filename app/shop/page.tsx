import { createServerSupabaseClient } from "@/lib/auth";
import ShopContent from "@/components/ShopContent";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
    const supabase = createServerSupabaseClient();

    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();

    // 獲取所有配布資料（有 points 且 points > 0 的才會在商店展示）
    const { data: distributions } = await supabase
        .from("distributions")
        .select("*")
        .gt("points", 0)
        .order("points", { ascending: false });

    // 獲取用戶已收集的配布（用於標記「已擁有」）
    let userCollected: string[] = [];
    if (user) {
        const { data: userDistributions } = await supabase
            .from("user_distributions")
            .select("distribution_id")
            .eq("user_id", user.id);

        userCollected = userDistributions?.map(d => d.distribution_id as string) || [];
    }

    return (
        <ShopContent
            distributions={distributions || []}
            userCollected={userCollected}
            isLoggedIn={!!user}
        />
    );
}
