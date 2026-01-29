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
  bio: string | null;
  pokemon_first_year: number | null;
};

type ProfileFormProps = {
  user: User;
  profile: Profile | null;
};

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user.email || "",
    bio: profile?.bio || "",
    pokemon_first_year: profile?.pokemon_first_year || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        bio: formData.bio || null,
        pokemon_first_year: formData.pokemon_first_year
          ? parseInt(String(formData.pokemon_first_year))
          : null,
      })
      .eq("id", user.id);

    if (error) {
      setMessage("儲存失敗：" + error.message);
    } else {
      setMessage("儲存成功！");
      router.refresh();
    }
    setSaving(false);
  };

  // 生成年份選項 (1996 - 現在)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 1996; y--) {
    yearOptions.push(y);
  }

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

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-200/80">寶可夢首玩年份 🎮</span>
          <select
            value={formData.pokemon_first_year}
            onChange={(e) =>
              setFormData({ ...formData, pokemon_first_year: e.target.value })
            }
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          >
            <option value="" className="bg-slate-800">
              選擇年份
            </option>
            {yearOptions.map((year) => (
              <option key={year} value={year} className="bg-slate-800">
                {year}
              </option>
            ))}
          </select>
          <span className="text-xs text-white/50">
            你第一次玩寶可夢是哪一年？
          </span>
        </label>

        {profile?.role && (
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">會員等級</span>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <span
                className={`rounded-full px-3 py-1 text-xs ${profile.role === "admin"
                    ? "bg-purple-500/20 text-purple-200"
                    : profile.role === "vip"
                      ? "bg-yellow-500/20 text-yellow-200"
                      : "bg-blue-500/20 text-blue-200"
                  }`}
              >
                {profile.role === "admin"
                  ? "管理員"
                  : profile.role === "vip"
                    ? "VIP 會員"
                    : "一般會員"}
              </span>
            </div>
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="text-slate-200/80">個人簡介 ✏️</span>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            maxLength={200}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none resize-none"
            placeholder="介紹一下自己吧..."
          />
          <span className="text-xs text-white/50">
            {formData.bio.length}/200 字元
          </span>
        </label>

        {message && (
          <div
            className={`md:col-span-2 rounded-xl px-4 py-3 text-sm ${message.includes("成功")
                ? "bg-green-500/20 text-green-200"
                : "bg-red-500/20 text-red-200"
              }`}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="md:col-span-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>
    </section>
  );
}
