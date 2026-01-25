"use client";

import { useState, useEffect } from "react";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type AddRegistrationFormProps = {
  eventId: string;
  eventTitle: string;
  onSuccess?: () => void;
};

export default function AddRegistrationForm({ eventId, eventTitle, onSuccess }: AddRegistrationFormProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 載入所有會員列表
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await fetch("/api/admin/check-env");
      const { profiles: allProfiles } = await response.json();
      
      if (allProfiles) {
        setProfiles(allProfiles);
      }
    } catch (error) {
      console.error("載入會員失敗:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setMessage({ type: "error", text: "請選擇會員" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/registrations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          event_id: eventId,
          registered_at: registeredAt || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "報名失敗");
      }

      setMessage({ type: "success", text: "報名成功！" });
      setSelectedUserId("");
      setRegisteredAt("");
      
      // 3 秒後清除訊息並刷新頁面
      setTimeout(() => {
        setMessage(null);
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }, 1500);

    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "報名失敗"
      });
    } finally {
      setLoading(false);
    }
  };

  // 過濾會員列表
  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.full_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white/90">幫會員報名</h3>
      <p className="mt-1 text-xs text-white/60">
        為已註冊的會員直接建立報名記錄（狀態：已確認）
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* 搜尋框 */}
        <div>
          <label className="block text-xs text-white/60">搜尋會員</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="輸入姓名或 Email..."
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
          />
        </div>

        {/* 會員選擇 */}
        <div>
          <label className="block text-xs text-white/60">選擇會員</label>
          {loadingProfiles ? (
            <div className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
              載入中...
            </div>
          ) : (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              required
            >
              <option value="">-- 請選擇會員 --</option>
              {filteredProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name || profile.email || "未知會員"} ({profile.email})
                </option>
              ))}
            </select>
          )}
          {!loadingProfiles && filteredProfiles.length === 0 && searchTerm && (
            <p className="mt-1 text-xs text-white/40">找不到符合的會員</p>
          )}
        </div>

        {/* 報名時間 */}
        <div>
          <label className="block text-xs text-white/60">報名時間（選填）</label>
          <input
            type="datetime-local"
            value={registeredAt}
            onChange={(e) => setRegisteredAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
          />
          <p className="mt-1 text-xs text-white/40">
            留空則使用當前時間
          </p>
        </div>

        {/* 活動資訊 */}
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/60">活動</p>
          <p className="text-sm font-medium text-white/90">{eventTitle}</p>
        </div>

        {/* 訊息提示 */}
        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-500/20 text-green-200"
                : "bg-red-500/20 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 提交按鈕 */}
        <button
          type="submit"
          disabled={loading || !selectedUserId}
          className="w-full rounded-xl bg-sky-500/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "處理中..." : "確認報名"}
        </button>
      </form>
    </div>
  );
}
