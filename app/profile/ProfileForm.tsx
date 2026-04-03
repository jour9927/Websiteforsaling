"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email?: string;
};

type NotificationPreference = "site_only" | "site_email" | "site_discord" | "all";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  bio: string | null;
  pokemon_first_year: number | null;
  pokemon_first_game: string | null;
  username: string | null;
  notification_preference: NotificationPreference | null;
  notification_email: string | null;
  discord_webhook_url: string | null;
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
    pokemon_first_game: profile?.pokemon_first_game || "",
    username: profile?.username || "",
    notification_preference: profile?.notification_preference || "site_only",
    notification_email: profile?.notification_email || "",
    discord_webhook_url: profile?.discord_webhook_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    // 驗證 username 格式
    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      setMessage("公開 ID 格式錯誤：只能使用英文、數字、底線，3-20 字元");
      setSaving(false);
      return;
    }

    if (
      formData.notification_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.notification_email)
    ) {
      setMessage("通知 Email 格式錯誤，請重新確認");
      setSaving(false);
      return;
    }

    const effectiveNotificationEmail =
      formData.notification_email.trim() || user.email?.trim() || profile?.email?.trim() || "";

    if (
      (formData.notification_preference === "site_email" ||
        formData.notification_preference === "all") &&
      !effectiveNotificationEmail
    ) {
      setMessage("啟用 Email 推播前，請先填寫通知 Email 或確認帳號 Email 已存在");
      setSaving(false);
      return;
    }

    if (
      (formData.notification_preference === "site_discord" ||
        formData.notification_preference === "all") &&
      !/^https:\/\/discord(?:app)?\.com\/api\/webhooks\/.+/.test(formData.discord_webhook_url)
    ) {
      setMessage("Discord Webhook URL 格式錯誤，請貼上完整 webhook 連結");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        bio: formData.bio || null,
        pokemon_first_game: formData.pokemon_first_game || null,
        username: formData.username || null,
        notification_preference: formData.notification_preference,
        notification_email: formData.notification_email || null,
        discord_webhook_url: formData.discord_webhook_url || null,
      })
      .eq("id", user.id);

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        setMessage("此公開 ID 已被使用，請換一個");
      } else {
        setMessage("儲存失敗：" + error.message);
      }
    } else {
      setMessage("儲存成功！");
      router.refresh();
    }
    setSaving(false);
  };

  const notificationOptions: Array<{ value: NotificationPreference; label: string }> = [
    { value: "site_only", label: "僅站內通知" },
    { value: "site_email", label: "站內通知 + Email" },
    { value: "site_discord", label: "站內通知 + Discord" },
    { value: "all", label: "站內通知 + Email + Discord" },
  ];

  // 寶可夢遊戲列表（本傳 + 外傳）
  const pokemonGames = [
    // === 本傳系列 ===
    { year: 2022, name: "朱/紫 (Switch)", category: "本傳" },
    { year: 2022, name: "阿爾宙斯 (Switch)", category: "本傳" },
    { year: 2021, name: "晶燦鑽石/明亮珍珠 (Switch)", category: "本傳" },
    { year: 2019, name: "劍/盾 (Switch)", category: "本傳" },
    { year: 2018, name: "Let's Go 皮卡丘/伊布 (Switch)", category: "本傳" },
    { year: 2017, name: "究極之日/究極之月 (3DS)", category: "本傳" },
    { year: 2016, name: "太陽/月亮 (3DS)", category: "本傳" },
    { year: 2014, name: "終極紅寶石/始源藍寶石 (3DS)", category: "本傳" },
    { year: 2013, name: "X/Y (3DS)", category: "本傳" },
    { year: 2012, name: "黑2/白2 (NDS)", category: "本傳" },
    { year: 2010, name: "黑/白 (NDS)", category: "本傳" },
    { year: 2009, name: "心金/魂銀 (NDS)", category: "本傳" },
    { year: 2008, name: "白金 (NDS)", category: "本傳" },
    { year: 2006, name: "鑽石/珍珠 (NDS)", category: "本傳" },
    { year: 2004, name: "火紅/葉綠 (GBA)", category: "本傳" },
    { year: 2004, name: "綠寶石 (GBA)", category: "本傳" },
    { year: 2002, name: "紅寶石/藍寶石 (GBA)", category: "本傳" },
    { year: 2000, name: "水晶 (GBC)", category: "本傳" },
    { year: 1999, name: "金/銀 (GBC)", category: "本傳" },
    { year: 1998, name: "皮卡丘 (GB)", category: "本傳" },
    { year: 1996, name: "紅/綠/藍 (GB)", category: "本傳" },
    // === 外傳系列 ===
    { year: 2021, name: "New 寶可夢隨樂拍 (Switch)", category: "外傳" },
    { year: 2020, name: "寶可夢咖啡 Mix (Mobile)", category: "外傳" },
    { year: 2019, name: "Pokemon Masters (Mobile)", category: "外傳" },
    { year: 2018, name: "Pokemon Quest (Switch/Mobile)", category: "外傳" },
    { year: 2016, name: "Pokemon GO (Mobile)", category: "外傳" },
    { year: 2015, name: "神奇寶貝超級不可思議的迷宮 (3DS)", category: "外傳" },
    { year: 2015, name: "Pokken Tournament (Wii U)", category: "外傳" },
    { year: 2014, name: "Pokemon Shuffle (3DS/Mobile)", category: "外傳" },
    { year: 2013, name: "神奇寶貝不可思議的迷宮 (3DS)", category: "外傳" },
    { year: 2011, name: "Pokemon Rumble Blast (3DS)", category: "外傳" },
    { year: 2009, name: "Pokemon Rumble (Wii)", category: "外傳" },
    { year: 2008, name: "Pokemon Ranger 光的軌跡 (NDS)", category: "外傳" },
    { year: 2007, name: "Pokemon 不可思議的迷宮 時之探險隊/闇之探險隊 (NDS)", category: "外傳" },
    { year: 2006, name: "Pokemon Ranger (NDS)", category: "外傳" },
    { year: 2005, name: "Pokemon 不可思議的迷宮 (GBA/NDS)", category: "外傳" },
    { year: 2003, name: "Pokemon Channel (GC)", category: "外傳" },
    { year: 2003, name: "Pokemon Colosseum (GC)", category: "外傳" },
    { year: 2001, name: "Pokemon Stadium 金銀 (N64)", category: "外傳" },
    { year: 2000, name: "Pokemon Stadium 2 (N64)", category: "外傳" },
    { year: 1999, name: "Pokemon Stadium (N64)", category: "外傳" },
    { year: 1999, name: "Pokemon 隨樂拍 (N64)", category: "外傳" },
    { year: 1998, name: "Pokemon 皮卡丘 (N64)", category: "外傳" },
  ];

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
          <span className="text-slate-200/80">公開 ID 🔗</span>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-sm">/user/</span>
            <input
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value.toLowerCase() })
              }
              placeholder="your_username"
              maxLength={20}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>
          <span className="text-xs text-white/50">3-20 字元，只能使用英文、數字、底線</span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-200/80">首次接觸的寶可夢遊戲 🎮</span>
          <select
            value={formData.pokemon_first_game}
            onChange={(e) =>
              setFormData({ ...formData, pokemon_first_game: e.target.value })
            }
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          >
            <option value="" className="bg-slate-800">
              選擇你的第一款寶可夢遊戲
            </option>
            <optgroup label="📖 本傳系列" className="bg-slate-800">
              {pokemonGames
                .filter((g) => g.category === "本傳")
                .map((game, index) => (
                  <option key={`main-${index}`} value={game.name} className="bg-slate-800">
                    {game.year} - {game.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="🎯 外傳系列" className="bg-slate-800">
              {pokemonGames
                .filter((g) => g.category === "外傳")
                .map((game, index) => (
                  <option key={`spin-${index}`} value={game.name} className="bg-slate-800">
                    {game.year} - {game.name}
                  </option>
                ))}
            </optgroup>
          </select>
          <span className="text-xs text-white/50">
            你第一次玩的是哪款寶可夢遊戲？
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

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4">
            <p className="text-sm text-slate-200/80">通知偏好</p>
            <p className="mt-1 text-xs text-white/50">
              站內通知會保留在網站內，若啟用外送，私訊與管理通知也會同步送出。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-200/80">通知方式</span>
              <select
                value={formData.notification_preference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_preference: e.target.value as NotificationPreference,
                  })
                }
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                {notificationOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-200/80">通知 Email</span>
              <input
                type="email"
                value={formData.notification_email}
                onChange={(e) =>
                  setFormData({ ...formData, notification_email: e.target.value })
                }
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                placeholder={user.email || "you@example.com"}
              />
              <span className="text-xs text-white/50">
                留空時會沿用帳號 Email：{user.email || "目前沒有可用帳號 Email"}
              </span>
            </label>

            <label className="flex flex-col gap-2 text-sm md:col-span-2">
              <span className="text-slate-200/80">Discord Webhook URL</span>
              <input
                type="url"
                value={formData.discord_webhook_url}
                onChange={(e) =>
                  setFormData({ ...formData, discord_webhook_url: e.target.value })
                }
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                placeholder="https://discord.com/api/webhooks/..."
              />
              <span className="text-xs text-white/50">
                選擇 Discord 推播時必填。Webhook 只用於轉發通知，不會公開顯示。
              </span>
            </label>
          </div>
        </div>

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
