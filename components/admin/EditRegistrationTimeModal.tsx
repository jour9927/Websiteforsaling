"use client";

import { useState } from "react";

type EditRegistrationTimeModalProps = {
  registrationId: string;
  currentTime: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditRegistrationTimeModal({
  registrationId,
  currentTime,
  userName,
  onClose,
  onSuccess,
}: EditRegistrationTimeModalProps) {
  const [registeredAt, setRegisteredAt] = useState(
    currentTime ? new Date(currentTime).toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/time`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registered_at: new Date(registeredAt).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新失敗");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-white/90">修改報名時間</h3>
        <p className="mt-1 text-sm text-white/60">會員：{userName}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs text-white/60">報名時間</label>
            <input
              type="datetime-local"
              value={registeredAt}
              onChange={(e) => setRegisteredAt(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "更新中..." : "確認修改"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
