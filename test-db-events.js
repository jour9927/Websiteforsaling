require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, image_url, visual_card_url");
    
  console.log("Events:", JSON.stringify(events, null, 2));
}
main();
