"use client";

import { useEffect, useState } from "react";

type Migration = {
  id: string;
  filename: string;
  order: number;
  preview: string;
  fullContent: string;
  createdAt: string;
};

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null);

  useEffect(() => {
    async function fetchMigrations() {
      try {
        const response = await fetch('/api/admin/migrations');
        const data = await response.json();
        
        if (response.ok) {
          setMigrations(data.migrations || []);
        } else {
          setError(data.error || '載入失敗');
        }
      } catch {
        setError('網路錯誤，無法載入遷移記錄');
      } finally {
        setLoading(false);
      }
    }

    fetchMigrations();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
        <p className="mt-4 text-white/70">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4">
          <p className="text-sm text-red-200 font-semibold">⚠️ 錯誤</p>
          <p className="mt-1 text-xs text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold text-white">資料庫遷移歷史</h1>
        <p className="mt-2 text-sm text-white/70">
          查看所有資料庫結構變更記錄與 SQL 遷移檔案
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
          <span>總計 {migrations.length} 個版本</span>
          <span>•</span>
          <span>最新版本: {migrations.length > 0 ? migrations[migrations.length - 1].order.toString().padStart(3, '0') : 'N/A'}</span>
        </div>
      </section>

      {migrations.length === 0 ? (
        <section className="glass-card p-12 text-center">
          <p className="text-lg text-white/60">尚無資料庫遷移記錄</p>
        </section>
      ) : (
        <section className="glass-card overflow-hidden">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="bg-white/10 text-left text-xs uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">版本</th>
                <th className="px-6 py-4">檔案名稱</th>
                <th className="px-6 py-4">建立時間</th>
                <th className="px-6 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {migrations.map((migration) => (
                <tr key={migration.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                      {migration.order.toString().padStart(3, '0')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white/90">
                    {migration.filename}
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {new Date(migration.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedMigration(migration)}
                      className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                    >
                      查看內容
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Modal for viewing migration content */}
      {selectedMigration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedMigration(null)}
        >
          <div 
            className="glass-card max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  版本 {selectedMigration.order.toString().padStart(3, '0')}
                </h2>
                <p className="mt-1 text-xs text-white/60 font-mono">
                  {selectedMigration.filename}
                </p>
              </div>
              <button
                onClick={() => setSelectedMigration(null)}
                className="rounded-full bg-white/10 p-2 px-4 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                關閉
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="rounded-lg bg-black/40 p-4 text-xs text-white/90 font-mono overflow-x-auto">
                {selectedMigration.fullContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
