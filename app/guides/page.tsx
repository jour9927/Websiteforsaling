import { createServerSupabaseClient } from "@/lib/auth";
import GuidesContent from "@/components/GuidesContent";
import SkinGuides from "@/components/skin/SkinGuides";
import { getUiMode } from "@/lib/ui-mode.server";
import { isSkinMode } from "@/lib/ui-mode";

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
    const supabase = createServerSupabaseClient();

    // 獲取當前用戶
    const {
        data: { user },
    } = await supabase.auth.getUser();

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

        userCollected =
            userDistributions?.map((d) => d.distribution_id as string) || [];
    }

    const props = {
        distributions: distributions || [],
        userCollected,
        isLoggedIn: !!user,
        userId: user?.id,
    };

    return isSkinMode(getUiMode()) ? <SkinGuides {...props} /> : <GuidesContent {...props} />;
}
