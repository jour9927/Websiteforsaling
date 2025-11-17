import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

type Migration = {
  id: string;
  filename: string;
  order: number;
  preview: string;
  fullContent: string;
  createdAt: string;
};

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 檢查是否登入
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  // 檢查是否為管理員
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: "權限不足" }, { status: 403 });
  }

  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    // 檢查目錄是否存在
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({ migrations: [] });
    }

    // 讀取所有 .sql 檔案
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // 按檔名排序

    const migrations: Migration[] = files.map((filename, index) => {
      const filePath = path.join(migrationsDir, filename);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 取得前 5 行作為預覽
      const lines = content.split('\n');
      const preview = lines.slice(0, 5).join('\n');
      
      // 從檔名提取版本號 (例如: 001_initial_schema.sql -> 001)
      const orderMatch = filename.match(/^(\d+)_/);
      const order = orderMatch ? parseInt(orderMatch[1], 10) : index + 1;

      return {
        id: filename,
        filename,
        order,
        preview,
        fullContent: content,
        createdAt: stats.mtime.toISOString(),
      };
    });

    return NextResponse.json({ migrations });
  } catch (error) {
    console.error('Error reading migrations:', error);
    return NextResponse.json(
      { error: "讀取遷移檔案時發生錯誤" },
      { status: 500 }
    );
  }
}
