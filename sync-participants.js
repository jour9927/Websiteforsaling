require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
  const eventId = "d5ea72b9-c8d6-4cde-8be5-9de8f3bc144a";
  
  // 1. 取得 30 週年生死戰的 campaign id
  const { data: campaign } = await supabase
    .from("anniversary_campaigns")
    .select("id")
    .eq("slug", "guardian-trial-30th")
    .single();
    
  if (!campaign) {
    console.error("Campaign not found");
    return;
  }
  
  // 2. 取得所有已經報名 d5ea72b9-c8d6-4cde-8be5-9de8f3bc144a 的 user
  const { data: regs } = await supabase
    .from("registrations")
    .select("user_id, profiles(full_name, username)")
    .eq("event_id", eventId)
    .eq("status", "confirmed");
    
  console.log(`Found ${regs.length} registrations.`);
  
  // 3. 取得目前已經在 anniversary_participants 的人
  const { data: parts } = await supabase
    .from("anniversary_participants")
    .select("user_id")
    .eq("campaign_id", campaign.id);
    
  const existingUserIds = new Set(parts.map(p => p.user_id));
  
  let added = 0;
  // 4. 對於每個有報名卻不在 participants 的人，補上去
  for (const reg of regs) {
    if (!existingUserIds.has(reg.user_id)) {
      console.log(`Adding ${reg.profiles?.full_name || reg.profiles?.username} to anniversary_participants`);
      await supabase.from("anniversary_participants").insert({
        campaign_id: campaign.id,
        user_id: reg.user_id,
        total_battles_used: 0,
        win_streak: 0,
        max_win_streak: 0,
        total_wins: 0,
        partner_unlocked: false,
        second_pokemon_unlocked: false
      });
      added++;
    }
  }
  
  console.log(`Sync complete. Added ${added} new participants.`);
}

sync().catch(console.error);
