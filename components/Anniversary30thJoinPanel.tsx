"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Anniversary30thJoinPanelProps = {
  entryFee: number;
};

function formatCurrency(value: number) {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}

export function Anniversary30thJoinPanel({ entryFee }: Anniversary30thJoinPanelProps) {
  const router = useRouter();
  const [targetPokemon, setTargetPokemon] = useState("伊布");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const entryFeeLabel = formatCurrency(entryFee);

  async function handleJoin() {
    if (!targetPokemon.trim()) {
      setError("請先填寫你的主契約寶可夢。");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/anniversary-30th/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetPokemon: targetPokemon.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "建立參戰資格失敗");
      }

      setSuccess("主契約已建立，頁面正在更新。");
      router.refresh();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "建立參戰資格失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card rounded-3xl border border-amber-500/20 p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Step 1</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">鎖定你的主契約目標</h2>
      <p className="mt-3 text-sm leading-6 text-white/70">
        先決定這次 30 週年你最想守住哪一隻。建立後會同步開啟主契約資格，並記錄一筆 {entryFeeLabel} 的暫持保證金；若最後沒有守住，系統會在結算時退回。
      </p>

      <div className="mt-6 space-y-3">
        <label className="block text-xs uppercase tracking-[0.25em] text-white/45">
          這次想守住的主契約寶可夢
        </label>
        <input
          value={targetPokemon}
          onChange={(event) => setTargetPokemon(event.target.value)}
          placeholder="例如：伊布"
          className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-amber-400"
        />
        <p className="text-xs text-white/45">
          這一步先收你的願望目標。後續若曾進入前 10，第二契約的顯現入口才會真正打開。
        </p>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}

      <button
        type="button"
        onClick={handleJoin}
        disabled={submitting}
        className="mt-6 w-full rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "建立中..." : "鎖定目標並建立主契約"}
      </button>
      <p className="mt-3 text-xs text-white/45">
        建立完成後，就可以直接追蹤名次、進入守護戰場，並在進榜後查看第二契約流程。
      </p>
    </div>
  );
}
