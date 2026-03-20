require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  try {
    // Step 1: All profiles
    const {data: p, error: e1} = await s.from('profiles').select('id, full_name, username');
    if (e1) { console.log('profiles error:', e1); process.exit(1); }
    console.log('PROFILES:', JSON.stringify(p));
    
    // Step 2: Campaign
    const {data: c, error: e2} = await s.from('anniversary_campaigns').select('id, slug, starts_at, status, battles_per_day').eq('slug','guardian-trial-30th').single();
    if (e2) { console.log('campaign error:', e2); process.exit(1); }
    console.log('CAMPAIGN:', JSON.stringify(c));
    
    // Step 3: All participants
    const {data: ap, error: e3} = await s.from('anniversary_participants').select('id, user_id, campaign_id, partner_pokemon, total_battles_used, today_battles_used, win_streak, total_wins, partner_unlocked, last_battle_day').eq('campaign_id', c.id);
    if (e3) { console.log('participants error:', e3); process.exit(1); }
    console.log('ALL_PARTICIPANTS:', JSON.stringify(ap));
    
    process.exit(0);
  } catch(err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
})();
