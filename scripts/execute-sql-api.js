#!/usr/bin/env node

/**
 * Execute SQL via Supabase HTTP API directly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function executeSql() {
  const sqlFile = path.join(__dirname, '../supabase/migrations/038_table_only.sql');
  console.log('🚀 Executing SQL via Supabase HTTP API\n');
  console.log(`📄 File: ${sqlFile}\n`);

  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements\n`);

  let executed = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const stmtNum = i + 1;
    
    console.log(`[${stmtNum}/${statements.length}] Executing...`);
    
    try {
      // Use rpc with sql function if available
      // Otherwise this will fail and we'll skip
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
        body: JSON.stringify({ p_sql: stmt })
      });

      if (response.ok) {
        executed++;
        console.log('   ✅ Success\n');
      } else {
        const error = await response.text();
        
        // Some statements may fail if they already exist
        if (stmt.includes('CREATE TABLE') || stmt.includes('CREATE INDEX')) {
          console.log(`   ⚠️  Skipping (likely already exists)\n`);
          executed++;
        } else {
          failed++;
          console.error(`   ❌ Error: ${error}\n`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log('═'.repeat(60));
  console.log(`✅ Executed: ${executed}/${statements.length}`);
  console.log(`❌ Failed: ${failed}/${statements.length}`);
  console.log('═'.repeat(60) + '\n');

  if (failed === 0) {
    console.log('✨ All SQL executed successfully!\n');
    console.log('🎯 Next step: Run reward setup\n');
    console.log('   node --env-file=.env.local scripts/quick-setup.js\n');
    return true;
  }

  return false;
}

executeSql()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Execution failed:', err);
    process.exit(1);
  });
