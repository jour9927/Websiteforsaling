"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, History, TicketPercent, WalletCards } from "lucide-react";
import type { StoreRebateReward } from "@/lib/rewardExchange";

type RewardState = {
  balance: {
    availablePoints: number;
    lifetimePoints: number;
    updatedAt: string | null;
  };
  rewards: StoreRebateReward[];
  redemptions: RedemptionRow[];
};

type RedemptionRow = {
  id: string;
  reward_key: string;
  item_type: string;
  item_name: string;
  cost_points: number;
  discount_percent: number;
  backpack_item_id: string | null;
  created_at: string;
};

type GameRewardExchangeProps = {
  initialRewards: StoreRebateReward[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GameRewardExchange({ initialRewards }: GameRewardExchangeProps) {
  const [state, setState] = useState<RewardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemingKey, setRedeemingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rewards = state?.rewards ?? initialRewards;
  const availablePoints = state?.balance.availablePoints ?? 0;
  const lifetimePoints = state?.balance.lifetimePoints ?? 0;

  const bestAvailableReward = useMemo(() => {
    return [...rewards]
      .filter((reward) => reward.pointsCost <= availablePoints)
      .sort((a, b) => b.pointsCost - a.pointsCost)[0];
  }, [availablePoints, rewards]);

  async function loadState() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rewards/game-name", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "載入獎勵兌換資料失敗");
      }

      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入獎勵兌換資料失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadState();
  }, []);

  async function redeem(reward: StoreRebateReward) {
    setRedeemingKey(reward.key);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/rewards/game-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_key: reward.key }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "兌換失敗");
      }

      setMessage(data.message || "兌換成功，道具已加入背包。");
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "兌換失敗");
    } finally {
      setRedeemingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">獎勵兌換</h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              遊戲名稱登記獎勵點可兌換商店消費報銷券，報銷比例會在商店結帳時套用。
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-right">
            <div className="flex items-center justify-end gap-2 text-xs text-emerald-100/70">
              <WalletCards className="h-4 w-4" />
              可用點數
            </div>
            <p className="mt-1 text-3xl font-bold text-emerald-200">
              {loading ? "--" : availablePoints}
              <span className="ml-1 text-sm font-normal text-emerald-100/60">點</span>
            </p>
            <p className="mt-1 text-xs text-white/45">累積取得 {loading ? "--" : lifetimePoints}/10 點</p>
          </div>
        </div>

        {bestAvailableReward && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            目前最高可兌換 {bestAvailableReward.name}，商店消費最高報銷 {bestAvailableReward.discountPercent}%。
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => {
          const disabled = loading || availablePoints < reward.pointsCost || Boolean(redeemingKey);
          const redeeming = redeemingKey === reward.key;

          return (
            <article
              key={reward.key}
              className={`rounded-xl border p-4 transition ${
                reward.pointsCost <= availablePoints
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{reward.name}</p>
                  <p className="mt-1 text-xs text-white/50">{reward.description}</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">
                  {reward.pointsCost} 點
                </span>
              </div>

              <div className="mt-4 rounded-lg bg-black/20 px-3 py-2 text-xs leading-5 text-white/60">
                {reward.example}
              </div>

              <button
                type="button"
                onClick={() => void redeem(reward)}
                disabled={disabled}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {redeeming ? (
                  "兌換中..."
                ) : (
                  <>
                    <TicketPercent className="h-4 w-4" />
                    兌換
                  </>
                )}
              </button>
            </article>
          );
        })}
      </section>

      <section className="glass-card p-5 md:p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-white/60" />
          <h2 className="text-lg font-semibold text-white/90">兌換紀錄</h2>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-white/50">載入中...</p>
        ) : !state?.redemptions.length ? (
          <p className="mt-4 text-sm text-white/50">目前尚無兌換紀錄。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {state.redemptions.map((row) => (
              <article key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {row.item_name}
                  </p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                    -{row.cost_points} 點
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/45">
                  {formatDate(row.created_at)}，商店消費最高報銷 {row.discount_percent}%
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
