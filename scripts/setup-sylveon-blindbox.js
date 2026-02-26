/**
 * Setup Sylveon Blind Box Event Rewards
 * 
 * This script inserts the reward pool for the Sylveon blind box event:
 * - 50x Eevee (伊布)
 * - 50x Sylveon (仙子伊布) with 75,000 points
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSylveonBlindBox() {
  console.log('🎁 Setting up Sylveon Blind Box Event...\n');

  // Find the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title')
    .eq('title', '仙子伊布配布盲盒')
    .single();

  if (eventError || !event) {
    console.error('❌ Failed to find event:', eventError);
    return;
  }

  console.log(`✅ Found event: ${event.title}`);
  console.log(`   Event ID: ${event.id}\n`);

  // Check if rewards already exist
  const { data: existingRewards, error: checkError } = await supabase
    .from('blind_box_rewards')
    .select('id')
    .eq('event_id', event.id);

  if (checkError) {
    console.error('❌ Failed to check existing rewards:', checkError);
    return;
  }

  if (existingRewards && existingRewards.length > 0) {
    console.log('⚠️  Rewards already exist for this event');
    console.log(`   Found ${existingRewards.length} existing rewards\n`);
    
    // Display existing rewards
    const { data: rewards } = await supabase
      .from('blind_box_rewards')
      .select('*')
      .eq('event_id', event.id);
    
    console.log('📦 Current rewards:');
    rewards?.forEach(r => {
      if (r.min_points && r.max_points) {
        console.log(`   - ${r.pokemon_name}: ${r.remaining}/${r.quantity} remaining (${r.min_points.toLocaleString()}~${r.max_points.toLocaleString()} points)`);
      } else {
        console.log(`   - ${r.pokemon_name}: ${r.remaining}/${r.quantity} remaining (${r.points} points)`);
      }
    });
    
    return;
  }

  // Insert rewards
  const rewards = [
    {
      event_id: event.id,
      pokemon_name: '伊布',
      pokemon_name_en: 'Eevee',
      pokemon_dex_number: 133,
      points: 0,
      min_points: null,
      max_points: null,
      quantity: 50,
      remaining: 50,
      sprite_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
      notes: '基礎伊布，每盒必得'
    },
    {
      event_id: event.id,
      pokemon_name: '仙子伊布',
      pokemon_name_en: 'Sylveon',
      pokemon_dex_number: 700,
      points: 75000,
      min_points: 75000,
      max_points: 400000,
      quantity: 50,
      remaining: 50,
      sprite_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png',
      notes: '高點數仙子伊布，每盒必得，點數隨機 75,000~400,000'
    }
  ];

  const { data: insertedRewards, error: insertError } = await supabase
    .from('blind_box_rewards')
    .insert(rewards)
    .select();

  if (insertError) {
    console.error('❌ Failed to insert rewards:', insertError);
    return;
  }

  coif (r.min_points && r.max_points) {
      console.log(`      Points: ${r.min_points.toLocaleString()} ~ ${r.max_points.toLocaleString()} (random)`);
    } else {
      console.log(`      Points: ${r.points.toLocaleString()}`);
    }
    console.log(`      Quantity: ${r.quantity}`);
    console.log(`      Notes: ${r.notes}\n`);
  });

  console.log('✨ Sylveon Blind Box Event is ready!');
  console.log(`   Total boxes: 50`);
  console.log(`   Offline registrations: 48`);
  console.log(`   Price: $5,990`);
  console.log(`   Contents: 1x Eevee + 1x Sylveon (75k~400k pts random)is ready!');
  console.log(`   Total boxes: 50`);
  console.log(`   Offline registrations: 48`);
  console.log(`   Price: $5,990`);
  console.log(`   Launch date: 2026-03-12\n`);
}

setupSylveonBlindBox()
  .then(() => {
    console.log('✅ Setup completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  });
