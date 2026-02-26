#!/usr/bin/env node

/**
 * Run migration 038_blind_box_system.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    const migrationPath = path.join(__dirname, '../supabase/migrations/038_blind_box_system.sql');
    
    console.log('🚀 Running migration: 038_blind_box_system.sql\n');
    
    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found:', migrationPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n⚠️  Please manually execute this SQL in Supabase SQL Editor:');
    console.log('   1. Go to https://supabase.com/dashboard/project/_/sql');
    console.log('   2. Create a new query');
    console.log('   3. Paste the above SQL');
    console.log('   4. Run the query');
    console.log('\n   After running, execute: node scripts/setup-sylveon-blindbox.js\n');
}

runMigration();
