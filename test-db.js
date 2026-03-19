require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: campaign, error: cErr } = await supabase
    .from('anniversary_campaigns')
    .select('*')
    .eq('slug', 'guardian-trial-30th')
    .single();
  console.log('Campaign:', campaign ? campaign.id : cErr);

  if (campaign) {
    const { data: participants, error: pErr } = await supabase
      .from('anniversary_participants')
      .select('id, user_id, partner_pokemon')
      .eq('campaign_id', campaign.id);
    console.log(`Participants count:`, participants ? participants.length : pErr);
  }
}
main();
