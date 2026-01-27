"use client";

import { useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // 保留這些狀態以供未來使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [formData] = useState({
    full_name: profile?.full_name || "",
    email: user.email || ""
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saving, setSaving] = useState(false);

  return (
    <section className="glass-card p-8">
      <h2 className="mb-4 text-lg font-medium text-white/80">個人資料</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-200/80">姓名</span>
          <input
            value={formData.full_name}
            disabled
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/60 placeholder:text-white/40 focus:border-white/40 focus:outline-none disabled:opacity-50"
            placeholder="尚未設定"
          />
          <span className="text-xs text-white/50">姓名目前不開放更改</span>
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
              <span className={`rounded-full px-3 py-1 text-xs ${profile.role === 'admin' ? 'bg-purple-500/20 text-purple-200' :
                profile.role === 'vip' ? 'bg-yellow-500/20 text-yellow-200' :
                  'bg-blue-500/20 text-blue-200'
                }`}>
                {profile.role === 'admin' ? '管理員' : profile.role === 'vip' ? 'VIP 會員' : '一般會員'}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled
          className="md:col-span-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/40 cursor-not-allowed"
        >
          目前無可編輯的項目
        </button>
      </div>
    </section>
  );
}
