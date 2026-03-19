require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  try {
     const res1 = await supabase.from("anniversary_contracts").select("*").limit(1);
     console.log("contracts:", res1.error || 'ok');
     const res2 = await supabase.from("anniversary_reveal_states").select("*").limit(1);
     console.log("reveal_states:", res2.error || 'ok');
     const res3 = await supabase.from("anniversary_curated_routes").select("*").limit(1);
     console.log("routes:", res3.error || 'ok');
  } catch(e) { console.error(e) }
}
main();
