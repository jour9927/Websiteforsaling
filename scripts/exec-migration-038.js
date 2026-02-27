#!/usr/bin/env node

/**
 * Execute migration 038 via Supabase client
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

async function executeMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/038_blind_box_system.sql');
  
  console.log('🚀 Executing migration: 038_blind_box_system.sql\n');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 Executing SQL statements...\n');

  // Split SQL into individual statements and execute them
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments
    if (statement.trim().startsWith('--')) {
      continue;
    }

    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      
      // Use rpc to execute raw SQL (if available), otherwise try direct query
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement }).single();
      
      if (error) {
        // If exec_sql doesn't exist, try alternative methods
        console.log(`   ⚠️  RPC method failed, trying alternative...`);
        
        // For PostgreSQL, we need to use a different approach
        // Let's use the REST API with a raw query
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      successCount++;
      console.log(`   ✅ Success\n`);
    } catch (err) {
      errorCount++;
      console.error(`   ❌ Error:`, err.message);
      
      // Don't stop on errors for some statements (like IF NOT EXISTS, etc.)
      if (statement.includes('CREATE TABLE IF NOT EXISTS') || 
          statement.includes('CREATE INDEX IF NOT EXISTS') ||
          statement.includes('DROP TABLE IF EXISTS')) {
        console.log(`   ⚠️  Continuing... (statement may already exist)\n`);
        continue;
      }
      
      console.log(`   Statement: ${statement.substring(0, 100)}...\n`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Execution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log('═'.repeat(60) + '\n');

  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. Please review errors above.');
    console.log('💡 Tip: You may need to execute the migration manually in Supabase SQL Editor\n');
    return false;
  }

  console.log('✅ Migration completed successfully!\n');
  console.log('🎯 Next step: Run setup script');
  console.log('   node --env-file=.env.local scripts/setup-sylveon-blindbox.js\n');
  
  return true;
}

executeMigration()
  .then((success) => {
    if (success) {
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration had errors. Attempting setup anyway...\n');
      // Try to continue with setup
      require('./setup-sylveon-blindbox.js');
    }
  })
  .catch(err => {
    console.error('❌ Migration execution failed:', err);
    console.log('\n💡 Please execute the SQL manually in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/_/sql\n');
    process.exit(1);
  });
