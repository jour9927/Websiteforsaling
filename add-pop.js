require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const searchTerm = 'pop';
  
  // Find the user in profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
    
  if (profileError || !profiles || profiles.length === 0) {
    console.error('Could not find user containing "pop" in profiles.', profileError);
    return;
  }
  
  console.log(`Found ${profiles.length} matching profile(s):`, profiles);
  const targetUser = profiles[0]; // pick the first one
  console.log(`Selecting user to insert:`, targetUser);
  
  // Find the campaign
  const { data: campaign } = await supabase
    .from('anniversary_campaigns')
    .select('id')
    .eq('slug', 'guardian-trial-30th')
    .single();
    
  if (!campaign) {
    console.error('Campaign not found.');
    return;
  }
  
  // Check if they are already in
  const { data: existing } = await supabase
    .from('anniversary_participants')
    .select('id')
    .eq('user_id', targetUser.id)
    .eq('campaign_id', campaign.id)
    .maybeSingle();
    
  if (existing) {
    console.log(`User ${targetUser.username || targetUser.full_name} is ALREADY registered.`);
    return;
  }
  
  // Insert
  const { data: inserted, error: insertError } = await supabase
    .from('anniversary_participants')
    .insert({
      campaign_id: campaign.id,
      user_id: targetUser.id,
      target_pokemon: 'unknown', // Placeholder
      total_battles_used: 0,
      today_battles_used: 0,
      win_streak: 0,
      max_win_streak: 0,
      total_wins: 0,
      partner_unlocked: false,
      second_pokemon_unlocked: false
    })
    .select('*')
    .single();
    
  if (insertError) {
    console.error('Failed to insert participant:', insertError);
  } else {
    console.log(`Successfully registered ${targetUser.username || targetUser.full_name}! Participant ID:`, inserted.id);
  }
}

main().catch(console.error);
