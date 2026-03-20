require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Set start time to 2 hours ago so the event is "started"
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('anniversary_campaigns')
    .update({ starts_at: twoHoursAgo })
    .eq('slug', 'guardian-trial-30th')
    .select('id, slug, starts_at');
    
  console.log('Updated campaign:', error || data);
  
  // Also reset the admin user's battles so they can play fresh
  const email = 'jour9927@gmail.com';
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  
  if (user) {
    const { data: campaign } = await supabase.from('anniversary_campaigns').select('id').eq('slug', 'guardian-trial-30th').single();
    const { data: participant } = await supabase.from('anniversary_participants').select('*').eq('user_id', user.id).eq('campaign_id', campaign.id).single();
    
    if (participant) {
      await supabase.from('anniversary_battles').delete().eq('participant_id', participant.id);
      await supabase.from('anniversary_participants').update({
        today_battles_used: 0,
        total_battles_used: 0,
        win_streak: 0,
        max_win_streak: 0,
        total_wins: 0,
      }).eq('id', participant.id);
      console.log('Reset battles for', email);
    }
  }
}

main().catch(console.error);
