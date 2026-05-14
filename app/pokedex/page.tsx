import { createServerSupabaseClient } from "@/lib/auth";
import PokedexContent from "@/components/PokedexContent";
import type { AttachedDistributionBadge, DistributionBadge, UserDistributionRecord } from "@/lib/distributionBadges";

export default async function PokedexPage() {
    const supabase = createServerSupabaseClient();

    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();

    // 獲取所有配布資料（隱藏 HOME 配布：original_trainer=HOME 或 distribution_method 含 HOME）
    const { data: distributions } = await supabase
        .from("distributions")
        .select("*")
        .neq("original_trainer", "HOME")
        .not("distribution_method", "ilike", "%HOME%")
        .order("distribution_period_start", { ascending: false });

    // 獲取可附加的證章/緞帶目錄（獨立於配布收藏）
    const { data: distributionBadges } = await supabase
        .from("distribution_badges")
        .select("*")
        .order("generation", { ascending: false })
        .order("sort_order", { ascending: true });

    // 獲取用戶已收集的配布與已附加證章
    let userCollected: string[] = [];
    let userDistributionRecords: UserDistributionRecord[] = [];
    let attachedBadgesByDistributionId: Record<string, AttachedDistributionBadge[]> = {};

    if (user) {
        const { data: userDistributions } = await supabase
            .from("user_distributions")
            .select("id, distribution_id")
            .eq("user_id", user.id);

        userDistributionRecords = (userDistributions || []).map((record) => ({
            id: record.id as string,
            distribution_id: record.distribution_id as string,
        }));
        userCollected = userDistributionRecords.map(d => d.distribution_id);

        const { data: userBadgeAttachments } = await supabase
            .from("user_distribution_badges")
            .select(`
                id,
                user_distribution_id,
                distribution_badges (*),
                user_distributions!inner (distribution_id)
            `)
            .eq("user_id", user.id);

        attachedBadgesByDistributionId = (userBadgeAttachments || []).reduce((acc, attachment) => {
            const userDistribution = attachment.user_distributions as unknown as { distribution_id?: string } | null;
            const badge = attachment.distribution_badges as unknown as DistributionBadge | null;
            const distributionId = userDistribution?.distribution_id;

            if (!distributionId || !badge) return acc;
            if (!acc[distributionId]) acc[distributionId] = [];
            acc[distributionId].push({
                ...badge,
                attachment_id: attachment.id as string,
            });
            return acc;
        }, {} as Record<string, AttachedDistributionBadge[]>);
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
            badges={(distributionBadges || []) as DistributionBadge[]}
            userCollected={userCollected}
            userDistributionRecords={userDistributionRecords}
            attachedBadgesByDistributionId={attachedBadgesByDistributionId}
            isLoggedIn={!!user}
            userId={user?.id}
        />
    );
}
