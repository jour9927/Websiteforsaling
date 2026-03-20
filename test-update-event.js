require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const eventId = 'd5ea72b9-c8d6-4cde-8be5-9de8f3bc144a';
  const { data, error } = await supabase
    .from("events")
    .update({ 
      image_url: "/images/anniversary-30th-bg.png",
      title: "30 週年寶可夢對決祭典" // Also update the title to the new one
    })
    .eq("id", eventId)
    .select();
    
  console.log("Updated Event:", error || data);
}
main();
