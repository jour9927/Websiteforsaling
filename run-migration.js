#!/usr/bin/env node

// 運行資料庫遷移腳本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 從 .env.local 讀取環境變數 (使用 node --env-file=.env.local 執行)
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('錯誤: 缺少 Supabase 環境變數');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath) {
    console.log(`正在執行遷移: ${filePath}`);

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
        const { data, error } = await supabase.rpc('exec', { sql });

        if (error) {
            // 嘗試直接執行 SQL（如果 exec 函數不存在）
            const { data: directData, error: directError } = await supabase
                .from('_migrations')
                .select('*')
                .limit(1);

            if (directError) {
                console.error('遷移失敗:', error);
                return false;
            }

            console.log('⚠️  無法使用 RPC 執行遷移，請手動在 Supabase SQL Editor 中執行:');
            console.log('─'.repeat(60));
            console.log(sql);
            console.log('─'.repeat(60));
            return false;
        }

        console.log('✅ 遷移成功執行');
        return true;
    } catch (err) {
        console.error('執行錯誤:', err);
        console.log('\n請手動在 Supabase SQL Editor 中執行以下 SQL:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        return false;
    }
}

// 主程式
async function main() {
    const migrationFile = 'supabase/sql_recovery/restore_distribution_points.sql';
    await runMigration(migrationFile);
}

main();
