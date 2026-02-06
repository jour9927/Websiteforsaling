"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'member' | 'admin';
  created_at: string;
};

export default function AdminMembersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<'all' | 'user' | 'member'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'member') => {
    setSaving(userId);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(`會員角色已更新為「${newRole === 'member' ? '群內成員' : '一般會員'}」`);
      loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗');
    } finally {
      setSaving(null);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesFilter = filter === 'all' || profile.role === filter;
    const matchesSearch = !searchTerm || 
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.full_name && profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const memberCount = profiles.filter(p => p.role === 'member').length;
  const userCount = profiles.filter(p => p.role === 'user').length;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">會員管理</h1>
          <p className="text-sm text-white/60">管理會員角色，升級為群內成員以獲得競標資格。</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="rounded-xl bg-blue-500/20 px-4 py-2 text-blue-200">
            <span className="text-lg font-bold">{memberCount}</span> 群內成員
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 text-white/70">
            <span className="text-lg font-bold">{userCount}</span> 一般會員
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm text-green-100">
          {success}
        </div>
      )}

      <article className="glass-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                filter === 'all' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              全部 ({profiles.length})
            </button>
            <button
              onClick={() => setFilter('member')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                filter === 'member' ? 'bg-blue-500/20 text-blue-200' : 'text-white/60 hover:text-white'
              }`}
            >
              群內成員 ({memberCount})
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                filter === 'user' ? 'bg-white/10 text-white/80' : 'text-white/60 hover:text-white'
              }`}
            >
              一般會員 ({userCount})
            </button>
          </div>
          <input
            type="text"
            placeholder="搜尋 Email 或姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:w-64"
          />
        </div>

        {loading ? (
          <div className="mt-8 text-center text-white/60">載入中...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="mt-8 text-center text-white/60">沒有符合條件的會員</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="px-4 py-3">會員</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">加入時間</th>
                  <th className="px-4 py-3">角色</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold uppercase">
                          {(profile.full_name || profile.email).slice(0, 2)}
                        </div>
                        <span className="font-medium text-white/90">
                          {profile.full_name || '(未設定)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/70">{profile.email}</td>
                    <td className="px-4 py-4 text-white/70">
                      {new Date(profile.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        profile.role === 'member'
                          ? 'bg-blue-500/20 text-blue-200'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {profile.role === 'member' ? '群內成員' : '一般會員'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {profile.role === 'member' ? (
                        <button
                          onClick={() => handleRoleChange(profile.id, 'user')}
                          disabled={saving === profile.id}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {saving === profile.id ? '處理中...' : '降為一般會員'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(profile.id, 'member')}
                          disabled={saving === profile.id}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"
                        >
                          {saving === profile.id ? '處理中...' : '升為群內成員'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
