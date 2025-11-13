"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type ProfileFormProps = {
  user: User;
  profile: Profile | null;
};

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user.email || ""
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim() || null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess("資料更新成功！");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card p-8">
      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        {error && (
          <div className="md:col-span-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="md:col-span-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {success}
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-200/80">姓名</span>
          <input
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            placeholder="輸入您的姓名"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-200/80">Email</span>
          <input
            type="email"
            value={formData.email}
            disabled
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/60 placeholder:text-white/40 focus:border-white/40 focus:outline-none disabled:opacity-50"
          />
          <span className="text-xs text-white/50">Email 無法修改</span>
        </label>

        {profile?.role && (
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">會員等級</span>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <span className={`rounded-full px-3 py-1 text-xs ${
                profile.role === 'admin' ? 'bg-purple-500/20 text-purple-200' :
                profile.role === 'vip' ? 'bg-yellow-500/20 text-yellow-200' :
                'bg-blue-500/20 text-blue-200'
              }`}>
                {profile.role === 'admin' ? '管理員' : profile.role === 'vip' ? 'VIP 會員' : '一般會員'}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="md:col-span-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </form>
    </section>
  );
}
