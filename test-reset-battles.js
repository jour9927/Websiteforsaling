require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'jour9927@gmail.com';
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.log("User not found");
    return;
  }
  
  // Reset their anniversary_participants daily count
  const { data: campaign } = await supabase.from('anniversary_campaigns').select('id').eq('slug', 'guardian-trial-30th').single();
  const { data: participant } = await supabase.from('anniversary_participants').select('*').eq('user_id', user.id).eq('campaign_id', campaign.id).single();
  
  if (participant) {
    await supabase.from('anniversary_participants').update({
      today_battles_used: 0,
      total_battles_used: 0, // Reset to 0 so the script rotation starts at dice -> trivia -> slots
    }).eq('id', participant.id);
    
    // Also delete any existing battles so it doesn't try to resume
    await supabase.from('anniversary_battles').delete().eq('participant_id', participant.id);
    
    console.log("Reset successful for", email);
  } else {
    console.log("Participant not found for", email);
  }
}

main().catch(console.error);
