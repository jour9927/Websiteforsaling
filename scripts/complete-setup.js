#!/usr/bin/env node

/**
 * Complete setup for Sylveon Blind Box Event
 * 
 * This script will:
 * 1. Display SQL to execute in Supabase Dashboard
 * 2. Wait for user confirmation
 * 3. Setup rewards data
 * 4. Verify setup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🎁 Sylveon Blind Box Event - Complete Setup\n');
  console.log('═'.repeat(60) + '\n');

  // Step 1: Check if migration already executed
  console.log('📋 Step 1: Checking if blind_box_rewards table exists...\n');
  
  const { data: tables, error: tableError } = await supabase
    .from('blind_box_rewards')
    .select('id')
    .limit(1);

  if (tableError && tableError.code === '42P01') {
    // Table doesn't exist - need to run migration
    console.log('❌ blind_box_rewards table does not exist\n');
    console.log('📄 Please execute this SQL in Supabase Dashboard:');
    console.log('   👉 https://supabase.com/dashboard/project/_/sql\n');
    console.log('─'.repeat(60));
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/038_blind_box_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(sql);
    console.log('─'.repeat(60) + '\n');

    const answer = await question('Have you executed the SQL? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n⚠️  Please execute the SQL first, then run this script again.\n');
      rl.close();
      process.exit(0);
    }
  } else if (!tableError) {
    console.log('✅ blind_box_rewards table exists\n');
  }

  // Step 2: Check if event exists
  console.log('📋 Step 2: Checking if event exists...\n');
  
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, price, max_participants, start_date')
    .eq('title', '仙子伊布配布盲盒')
    .maybeSingle();

  if (eventError) {
    console.error('❌ Error checking event:', eventError);
    rl.close();
    process.exit(1);
  }

  if (!event) {
    console.log('❌ Event not found - it should have been created by the migration\n');
    console.log('⚠️  Please check if the INSERT INTO events statement executed successfully\n');
    rl.close();
    process.exit(1);
  }

  console.log(`✅ Event found: ${event.title}`);
  console.log(`   ID: ${event.id}`);
  console.log(`   Price: $${event.price}`);
  console.log(`   Max participants: ${event.max_participants}`);
  console.log(`   Start date: ${event.start_date}\n`);

  // Step 3: Check if rewards already exist
  console.log('📋 Step 3: Setting up rewards...\n');
  
  const { data: existingRewards } = await supabase
    .from('blind_box_rewards')
    .select('id')
    .eq('event_id', event.id);

  if (existingRewards && existingRewards.length > 0) {
    console.log(`⚠️  Rewards already exist (${existingRewards.length} items)`);
    const answer = await question('Do you want to skip reward setup? (yes/no): ');
    
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      console.log('\n✅ Skipping reward setup\n');
    } else {
      console.log('\n⚠️  Please manually delete existing rewards first if you want to recreate them\n');
    }
  } else {
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
      rl.close();
      process.exit(1);
    }

    console.log('✅ Successfully inserted rewards:\n');
    insertedRewards?.forEach(r => {
      console.log(`   📦 ${r.pokemon_name} (${r.pokemon_name_en})`);
      if (r.min_points && r.max_points) {
        console.log(`      Points: ${r.min_points.toLocaleString()}~${r.max_points.toLocaleString()} (random)`);
      } else {
        console.log(`      Points: ${r.points.toLocaleString()}`);
      }
      console.log(`      Quantity: ${r.quantity}\n`);
    });
  }

  // Step 4: Final verification
  console.log('📋 Step 4: Final verification...\n');
  
  const { data: finalRewards } = await supabase
    .from('blind_box_rewards')
    .select('*')
    .eq('event_id', event.id);

  console.log('═'.repeat(60));
  console.log('🎉 Setup Complete!\n');
  console.log(`📦 Event: ${event.title}`);
  console.log(`💰 Price: $${event.price}`);
  console.log(`📅 Launch: ${event.start_date}`);
  console.log(`🎁 Rewards: ${finalRewards?.length || 0} types configured\n`);
  
  finalRewards?.forEach(r => {
    if (r.min_points && r.max_points) {
      console.log(`   • ${r.pokemon_name}: ${r.remaining}/${r.quantity} (${r.min_points.toLocaleString()}~${r.max_points.toLocaleString()} pts)`);
    } else {
      console.log(`   • ${r.pokemon_name}: ${r.remaining}/${r.quantity} (${r.points.toLocaleString()} pts)`);
    }
  });
  
  console.log('\n✨ Ready to accept registrations!');
  console.log('═'.repeat(60) + '\n');

  rl.close();
}

main().catch(err => {
  console.error('❌ Setup failed:', err);
  rl.close();
  process.exit(1);
});
