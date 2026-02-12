import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    // 1. 驗證管理員身份
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. 使用 service role key 查詢（繞過 RLS）
    const adminClient = createAdminSupabaseClient();

    const [stampsRes, attemptsRes, rewardsRes] = await Promise.all([
        adminClient
            .from("eevee_day_stamps")
            .select("id, user_id, earned_at")
            .order("earned_at", { ascending: false }),
        adminClient
            .from("eevee_day_quiz_attempts")
            .select("id, user_id, score, passed, attempted_at")
            .order("attempted_at", { ascending: false })
            .limit(50),
        adminClient
            .from("eevee_day_rewards")
            .select("id, user_id, selected_at, distribution_id")
            .order("selected_at", { ascending: false }),
    ]);

    const rawStamps = stampsRes.data || [];
    const rawAttempts = attemptsRes.data || [];
    const rawRewards = rewardsRes.data || [];

    // 3. 聚合 stamps by user_id
    const stampMap = new Map<string, number>();
    rawStamps.forEach((s: { user_id: string }) => {
        stampMap.set(s.user_id, (stampMap.get(s.user_id) || 0) + 1);
    });

    // 4. 收集所有相關的 user IDs
    const allUserIds = new Set<string>();
    rawStamps.forEach((s: { user_id: string }) => allUserIds.add(s.user_id));
    rawAttempts.forEach((a: { user_id: string }) => allUserIds.add(a.user_id));
    rawRewards.forEach((r: { user_id: string }) => allUserIds.add(r.user_id));

    // 5. 查詢 profiles
    const profilesMap = new Map<string, { full_name: string | null; email: string }>();
    if (allUserIds.size > 0) {
        const { data: profilesData } = await adminClient
            .from("profiles")
            .select("id, full_name, email")
            .in("id", [...allUserIds]);
        (profilesData || []).forEach((p: { id: string; full_name: string | null; email: string }) => {
            profilesMap.set(p.id, { full_name: p.full_name, email: p.email });
        });
    }

    // 6. 查詢 distributions for rewards
    const distributionIds = rawRewards
        .map((r: { distribution_id: string }) => r.distribution_id)
        .filter(Boolean);
    const distributionsMap = new Map<string, { pokemon_name: string; pokemon_sprite_url: string | null }>();
    if (distributionIds.length > 0) {
        const { data: distData } = await adminClient
            .from("distributions")
            .select("id, pokemon_name, pokemon_sprite_url")
            .in("id", distributionIds);
        (distData || []).forEach((d: { id: string; pokemon_name: string; pokemon_sprite_url: string | null }) => {
            distributionsMap.set(d.id, { pokemon_name: d.pokemon_name, pokemon_sprite_url: d.pokemon_sprite_url });
        });
    }

    // 7. 組裝回傳資料
    const stamps = [...stampMap.entries()]
        .map(([user_id, count]) => ({
            user_id,
            stamp_count: count,
            profile: profilesMap.get(user_id) || null,
        }))
        .sort((a, b) => b.stamp_count - a.stamp_count);

    const attempts = rawAttempts.map((a: { id: string; user_id: string; score: number; passed: boolean; attempted_at: string }) => ({
        ...a,
        profile: profilesMap.get(a.user_id) || null,
    }));

    const rewards = rawRewards.map((r: { id: string; user_id: string; selected_at: string; distribution_id: string }) => ({
        ...r,
        profile: profilesMap.get(r.user_id) || null,
        distribution: distributionsMap.get(r.distribution_id) || null,
    }));

    return NextResponse.json({ stamps, attempts, rewards });
}
