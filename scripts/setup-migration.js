#!/usr/bin/env node

/**
 * Simple SQL Executor - Multiple Execution Methods
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const sqlFile = path.join(__dirname, '../supabase/migrations/038_table_only.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('🚀 Sylveon Blind Box Migration Setup\n');
console.log('═'.repeat(70) + '\n');

console.log('📋 Method 1: 在 Supabase Dashboard 中手動執行（推薦）\n');
console.log('1. 開啟 SQL Editor: https://supabase.com/dashboard/project/_/sql');
console.log('2. 點擊 "New query"');
console.log('3. 複製下面的 SQL，貼入編輯器：\n');
console.log('─'.repeat(70));
console.log(sql);
console.log('─'.repeat(70) + '\n');

console.log('4. 點擊 "Run" 執行\n');

console.log('═'.repeat(70) + '\n');
console.log('📋 Method 2: 使用 Supabase CLI（需要登入）\n');

// Check if logged in
const { execSync } = require('child_process');

try {
  const output = execSync('supabase projects list 2>&1', { encoding: 'utf8' });
  
  if (output.includes('Access token not provided')) {
    console.log('❌ 您尚未登入 Supabase CLI\n');
    console.log('執行此命令登入：');
    console.log('   supabase login\n');
    
    console.log('然後執行以下命令推送 migration：');
    console.log('   supabase db push\n');
  } else {
    console.log('✅ 已連接到 Supabase\n');
    console.log('執行此命令推送 migration：');
    console.log('   supabase db push\n');
  }
} catch (err) {
  console.log('尋找其他方法...\n');
}

// Generate direct Supabase Dashboard link
const projectRef = 'wlomyjuuqovdatrxrfpu';
const dashboardLink = `https://supabase.com/dashboard/project/${projectRef}/sql`;

console.log('═'.repeat(70) + '\n');
console.log('💡 快速連結：\n');
console.log(`🔗 SQL Editor: ${dashboardLink}\n`);

console.log('═'.repeat(70) + '\n');
console.log('📝 SQL 文件位置：\n');
console.log(`   supabase/migrations/038_table_only.sql\n`);

console.log('✅ 執行完成後，執行：\n');
console.log('   node --env-file=.env.local scripts/quick-setup.js\n');

// Offer to open browser on macOS
if (process.platform === 'darwin') {
  console.log('─'.repeat(70) + '\n');
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('要開啟 SQL Editor 嗎？(yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      execSync(`open "${dashboardLink}"`);
      console.log('\n✅ 已開啟 SQL Editor\n');
    }
    rl.close();
  });
} else {
  console.log('\n');
}
