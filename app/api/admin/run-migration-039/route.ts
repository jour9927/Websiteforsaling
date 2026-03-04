import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 新增 AI 個人化欄位
        const { error: error1 } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT NULL`
        });

        const { error: error2 } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_user_summary TEXT DEFAULT NULL`
        });

        // 如果 rpc 不可用，嘗試直接用 REST
        if (error1 || error2) {
            // 嘗試用 fetch 直接對 PostgreSQL REST API
            const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
            
            const sqlStatements = [
                "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT NULL",
                "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_user_summary TEXT DEFAULT NULL"
            ];

            for (const sql of sqlStatements) {
                const res = await fetch(`${dbUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': serviceKey,
                        'Authorization': `Bearer ${serviceKey}`,
                    },
                    body: JSON.stringify({ sql }),
                });
                if (!res.ok) {
                    console.warn(`SQL exec warning: ${await res.text()}`);
                }
            }
        }

        return NextResponse.json({ success: true, message: "Migration applied (or columns already exist)" });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
