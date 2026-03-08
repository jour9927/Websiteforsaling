/**
 * 一次性腳本：為所有真實用戶灌入虛擬社交數據
 * - 每個用戶的 followers_count 設為 3-8
 * - 每個用戶的 popularity_score 設為 5-25
 * 
 * 用法: node scripts/seed-social-data.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

async function seedSocialData() {
    console.log("🚀 開始灌入虛擬社交數據...\n");

    // 取得所有真實用戶
    const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name, followers_count, popularity_score");

    if (profilesErr) {
        console.error("❌ 讀取 profiles 失敗:", profilesErr);
        return;
    }
    console.log(`📋 找到 ${profiles.length} 個真實用戶\n`);

    let updated = 0;
    let skipped = 0;

    for (const profile of profiles) {
        const hash = hashCode(profile.id);
        const currentFollowers = profile.followers_count || 0;
        const currentPop = profile.popularity_score || 0;

        // 只灌尚未有數據的用戶
        if (currentFollowers > 0 && currentPop > 0) {
            console.log(`  ⏭️  ${profile.full_name || "未命名"}: 已有數據 (${currentFollowers} followers, ${currentPop} pop)`);
            skipped++;
            continue;
        }

        const newFollowers = currentFollowers > 0 ? currentFollowers : 3 + (hash % 6);   // 3-8
        const newPop = currentPop > 0 ? currentPop : 5 + (hash % 21);                    // 5-25

        const { error: updateErr } = await supabase
            .from("profiles")
            .update({
                followers_count: newFollowers,
                popularity_score: newPop,
            })
            .eq("id", profile.id);

        if (updateErr) {
            console.error(`  ❌ ${profile.full_name || profile.id}:`, updateErr.message);
        } else {
            console.log(`  ✅ ${profile.full_name || "未命名"}: followers=${newFollowers}, popularity=${newPop}`);
            updated++;
        }
    }

    console.log(`\n✨ 完成！更新 ${updated} 位用戶，跳過 ${skipped} 位`);
}

seedSocialData().catch(console.error);
