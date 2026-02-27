#!/usr/bin/env node

/**
 * Execute SQL file via Supabase client
 * This bypasses the CLI and directly uses the Supabase REST API
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

async function executeSqlDirect(sql) {
  // Use direct PostgreSQL connection via REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function executeViaPsql(sqlFile) {
  console.log('🔧 Attempting to execute SQL via psql...\n');
  
  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Could not extract project reference from URL');
    return false;
  }

  console.log(`📋 Project: ${projectRef}`);
  console.log(`📄 SQL file: ${sqlFile}\n`);
  
  // Try to execute via psql if available
  const { execSync } = require('child_process');
  
  try {
    // Check psql availability
    execSync('which psql', { stdio: 'ignore' });
    
    console.log('✅ psql found, executing SQL...\n');
    
    // Build connection string (requires password to be set in environment or .pgpass)
    const dbUrl = `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;
    
    console.log('⚠️  psql requires database password');
    console.log('Please execute manually:');
    console.log(`psql ${dbUrl} -f ${sqlFile}\n`);
    
    return false;
  } catch (err) {
    console.log('❌ psql not available\n');
    return false;
  }
}

async function main() {
  const sqlFile = path.join(__dirname, '../supabase/migrations/038_table_only.sql');
  
  console.log('🚀 Executing SQL Migration\n');
  console.log('═'.repeat(60) + '\n');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found:', sqlFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Try psql first
  await executeViaPsql(sqlFile);
  
  // If psql not available, show manual instructions
  console.log('📋 Manual Execution Required:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/_/sql');
  console.log('2. Click "New query"');
  console.log('3. Copy and paste the following SQL:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n4. Click "Run" to execute\n');
  
  // Ask if user has executed
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Have you executed the SQL in Supabase Dashboard? (yes/no): ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n✅ Great! Proceeding to setup rewards...\n');
        
        // Run setup script
        const setupScript = path.join(__dirname, 'quick-setup.js');
        require('child_process').fork(setupScript, [], {
          env: process.env,
          stdio: 'inherit'
        });
      } else {
        console.log('\n⚠️  Please execute the SQL first, then run:');
        console.log('   node --env-file=.env.local scripts/quick-setup.js\n');
        resolve();
      }
    });
  });
}

main().catch(err => {
  console.error('❌ Execution failed:', err);
  process.exit(1);
});
