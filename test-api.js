require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: campaign } = await supabase
    .from("anniversary_campaigns")
    .select("id, event_id, slug, title")
    .eq("slug", "guardian-trial-30th")
    .single();

  if (!campaign) {
    console.log("No campaign found");
    return;
  }

  const { data: participants } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id);

  if (!participants || participants.length === 0) {
    console.log("No participants");
    return;
  }

  const participantIds = participants.map((p) => p.id);
  const userIds = participants.map((p) => p.user_id);

  const [{ data: profiles }, { data: contracts }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").in("id", userIds),
    supabase.from("anniversary_contracts").select("*").in("participant_id", participantIds),
  ]);

  console.log("Participants:", participants.length);
  console.log("Profiles:", profiles?.length);
  console.log("Contracts:", contracts?.length);
  console.dir(participants, { depth: null });
}
main();
