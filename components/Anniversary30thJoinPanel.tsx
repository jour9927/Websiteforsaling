"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Anniversary30thJoinPanel() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleJoin() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/anniversary-30th/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "預先報名失敗");
      }

      setSuccess("預先報名已完成，正在開啟寶可夢選擇。");
      router.refresh();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "預先報名失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-black/30 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/75">
        Step 1
      </p>
      <h2 className="mt-3 text-2xl font-black text-white">完成預先報名</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
        4/23 開放預先報名。完成後即可選擇一隻出場寶可夢；4/25 開戰後，每天可進行 2 場復古對戰。
      </p>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}

      <button
        type="button"
        onClick={handleJoin}
        disabled={submitting}
        className="mt-6 w-full rounded bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "報名中..." : "預先報名並選擇寶可夢"}
      </button>
    </section>
  );
}
