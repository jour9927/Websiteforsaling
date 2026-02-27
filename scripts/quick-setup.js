#!/usr/bin/env node

/**
 * Quick setup - Create event and rewards directly
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickSetup() {
  console.log('🚀 Quick Setup - Sylveon Blind Box Event\n');

  // Step 1: Check if event already exists
  const { data: existingEvent } = await supabase
    .from('events')
    .select('id, title')
    .eq('title', '仙子伊布配布盲盒')
    .maybeSingle();

  let event;

  if (existingEvent) {
    console.log(`✅ Event already exists: ${existingEvent.title}`);
    console.log(`   ID: ${existingEvent.id}\n`);
    event = existingEvent;
  } else {
    // Create event
    console.log('📝 Creating event...\n');
    
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        title: '仙子伊布配布盲盒',
        description: '每個盲盒包含 2 隻寶可夢：1 隻伊布 + 1 隻高點數仙子伊布（75,000~400,000 點數隨機）！限量 50 盒，機會難得，先搶先贏！',
        start_date: '2026-03-12 10:00:00+08',
        end_date: '2026-03-12 18:00:00+08',
        max_participants: 50,
        offline_registrations: 48,
        price: 5990,
        is_free: false,
        status: 'published',
        location: '配布活動現場',
        organizer_category: 'admin',
        eligibility_requirements: '需完成線上付款或現場報名'
      })
      .select()
      .single();

    if (eventError) {
      console.error('❌ Failed to create event:', eventError);
      process.exit(1);
    }

    console.log(`✅ Event created: ${newEvent.title}`);
    console.log(`   ID: ${newEvent.id}`);
    console.log(`   Price: $${newEvent.price}`);
    console.log(`   Max participants: ${newEvent.max_participants}\n`);
    
    event = newEvent;
  }

  // Step 2: Check if rewards exist
  const { data: existingRewards } = await supabase
    .from('blind_box_rewards')
    .select('id, pokemon_name')
    .eq('event_id', event.id);

  if (existingRewards && existingRewards.length > 0) {
    console.log(`✅ Rewards already exist (${existingRewards.length} items):`);
    existingRewards.forEach(r => {
      console.log(`   - ${r.pokemon_name}`);
    });
    console.log('\n');
  } else {
    // Create rewards
    console.log('📝 Creating rewards...\n');
    
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

    const { data: newRewards, error: rewardError } = await supabase
      .from('blind_box_rewards')
      .insert(rewards)
      .select();

    if (rewardError) {
      console.error('❌ Failed to create rewards:', rewardError);
      process.exit(1);
    }

    console.log('✅ Rewards created:\n');
    newRewards?.forEach(r => {
      console.log(`   📦 ${r.pokemon_name} (${r.pokemon_name_en})`);
      if (r.min_points && r.max_points) {
        console.log(`      Points: ${r.min_points.toLocaleString()}~${r.max_points.toLocaleString()} (random)`);
      } else {
        console.log(`      Points: ${r.points.toLocaleString()}`);
      }
      console.log(`      Quantity: ${r.quantity}\n`);
    });
  }

  // Final summary
  console.log('═'.repeat(60));
  console.log('🎉 Setup Complete!\n');
  console.log(`📦 Event: ${event.title}`);
  console.log(`💰 Price: $5,990`);
  console.log(`📅 Launch: 2026-03-12 10:00`);
  console.log(`🎁 Total boxes: 50`);
  console.log(`📍 Offline registrations: 48`);
  console.log(`\n🎁 Contents:`);
  console.log(`   • 1x 伊布 (Eevee)`);
  console.log(`   • 1x 仙子伊布 (Sylveon) - 75,000~400,000 points random\n`);
  console.log('✨ Ready to accept registrations!');
  console.log('═'.repeat(60) + '\n');
}

quickSetup()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  });
