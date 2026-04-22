"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GEN3_BATTLE_MOVESET,
  clamp,
  type EeveeGuardianLiveMetrics,
} from "@/lib/eeveeGuardian";

type CampaignData = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  totalDays: number;
  dailyBattles: number;
  winPoints: number;
  losePoints: number;
  targetMedals: number;
  rareRewardName: string;
  isActive: boolean;
  hasEnded: boolean;
  isUpcoming: boolean;
  daysElapsed: number;
  daysRemaining: number;
};

type PlayerProgress = {
  totalPoints: number;
  medalsCollected: number;
  targetMedals: number;
  totalBattles: number;
  totalWins: number;
  totalLosses: number;
  totalDamage: number;
  todayBattlesUsed: number;
  battlesRemainingToday: number;
  rareRewardUnlocked: boolean;
};

type PendingBattle = {
  id: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

type StatusResponse = {
  tableReady: boolean;
  message: string | null;
  campaign: CampaignData;
  player: PlayerProgress | null;
  live: EeveeGuardianLiveMetrics;
  pendingBattle: PendingBattle | null;
  canBattleToday: boolean;
};

type StartBattleResponse = {
  battleId: string;
  battleDay: string;
  metadata?: Record<string, unknown>;
  campaign: CampaignData;
  player: PlayerProgress;
  resuming: boolean;
};

type ResolveBattleResponse = {
  battle: {
    id: string;
    result: "won" | "lost";
    pointsAwarded: number;
    playerDamage: number;
    opponentDamage: number;
    turns: number;
  };
  campaign: CampaignData;
  player: PlayerProgress;
};

type BattlePhase = "idle" | "fighting" | "resolving" | "result";

type BattleResult = {
  result: "won" | "lost";
  pointsAwarded: number;
  playerDamage: number;
  opponentDamage: number;
  turns: number;
};

const MAX_HP = 180;
const MATCH_POOL = [
  "烈焰訓練家 Aria",
  "深林守衛 Luka",
  "港口巡查 Rena",
  "紫苑塔守夜人 Kyo",
  "冠軍道路旅者 Mina",
  "彩虹市對戰師 Theo",
] as const;

function MatchmakingOverlay({ opponentName }: { opponentName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl border border-amber-400/30 bg-[linear-gradient(160deg,#1a1530,#0d1a2a)] p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Random Matchmaking</p>
          <h2 className="mt-3 text-2xl font-black text-white">正在匹配對手</h2>

          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "300ms" }} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs text-white/55">匹配到的訓練家</p>
            <p className="mt-1 text-lg font-semibold text-amber-200">{opponentName}</p>
          </div>

          <p className="mt-4 text-sm text-white/60">
            即將進入 3gen 對戰畫面...
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function HpBar({ current }: { current: number }) {
  const percentage = clamp((current / MAX_HP) * 100, 0, 100);
  const barClassName =
    percentage > 55
      ? "bg-emerald-400"
      : percentage > 25
        ? "bg-amber-400"
        : "bg-rose-400";

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>HP</span>
        <span>{current} / {MAX_HP}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/50">{sub}</p> : null}
    </div>
  );
}

export function EeveeGuardianBattleHub() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);

  const [battlePhase, setBattlePhase] = useState<BattlePhase>("idle");
  const [battleId, setBattleId] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [opponentHp, setOpponentHp] = useState(MAX_HP);
  const [playerDamage, setPlayerDamage] = useState(0);
  const [opponentDamage, setOpponentDamage] = useState(0);
  const [actionLocked, setActionLocked] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchOpponent, setMatchOpponent] = useState<string>(MATCH_POOL[0]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  const campaign = statusData?.campaign;
  const player = statusData?.player;

  const canStartBattle = Boolean(statusData?.tableReady && statusData?.canBattleToday && campaign?.isActive);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/eevee-guardian/status", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMessage(errorData.error || "讀取活動狀態失敗");
        return;
      }

      const data = (await res.json()) as StatusResponse;
      setStatusData(data);

      if (!data.tableReady && data.message) {
        setMessage(data.message);
      }
    } catch {
      setMessage("讀取活動狀態失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const res = await fetch("/api/eevee-guardian/live", { cache: "no-store" });
      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as { campaign: CampaignData; live: EeveeGuardianLiveMetrics };
      setStatusData((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          campaign: {
            ...prev.campaign,
            ...data.campaign,
          },
          live: data.live,
        };
      });
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  const resetBattleLocalState = useCallback(() => {
    setBattleId(null);
    setTurns(0);
    setPlayerHp(MAX_HP);
    setOpponentHp(MAX_HP);
    setPlayerDamage(0);
    setOpponentDamage(0);
    setActionLocked(false);
    setBattleLog([]);
    setBattleResult(null);
    setBattlePhase("idle");
  }, []);

  const startBattle = useCallback(async () => {
    setMessage(null);
    setActionLocked(true);
    setIsMatchmaking(true);

    const randomOpponent = MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)];
    setMatchOpponent(randomOpponent);

    try {
      const res = await fetch("/api/eevee-guardian/battle/start", {
        method: "POST",
      });
      const data = (await res.json()) as StartBattleResponse & { error?: string };

      if (!res.ok) {
        setMessage(data.error || "無法開始對戰");
        setIsMatchmaking(false);
        setActionLocked(false);
        return;
      }

      setStatusData((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          campaign: data.campaign,
          player: data.player,
          pendingBattle: {
            id: data.battleId,
            created_at: new Date().toISOString(),
          },
          canBattleToday: data.player.battlesRemainingToday > 0,
        };
      });

      setBattleId(data.battleId);
      setTurns(0);
      setPlayerHp(MAX_HP);
      setOpponentHp(MAX_HP);
      setPlayerDamage(0);
      setOpponentDamage(0);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 2200);
      });

      setBattleLog([
        data.resuming
          ? `已恢復你今天未完成的戰局，對手 ${randomOpponent} 再度向你發起挑戰。`
          : `匹配成功：你遭遇 ${randomOpponent}，戰鬥開始。`,
      ]);
      setBattleResult(null);
      setBattlePhase("fighting");
    } catch {
      setMessage("開場失敗，請稍後再試");
    } finally {
      setIsMatchmaking(false);
      setActionLocked(false);
    }
  }, []);

  const submitBattleResult = useCallback(
    async (result: "won" | "lost", nextTurns: number, nextPlayerDamage: number, nextOpponentDamage: number, logs: string[]) => {
      if (!battleId) {
        return;
      }

      setBattlePhase("resolving");
      setActionLocked(true);

      try {
        const res = await fetch("/api/eevee-guardian/battle/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            battleId,
            result,
            playerDamage: nextPlayerDamage,
            opponentDamage: nextOpponentDamage,
            turns: nextTurns,
            eventLog: logs,
          }),
        });

        const data = (await res.json()) as ResolveBattleResponse & { error?: string };

        if (!res.ok) {
          setMessage(data.error || "結算失敗，請重試");
          setBattlePhase("fighting");
          setActionLocked(false);
          return;
        }

        setBattleResult(data.battle);
        setStatusData((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            campaign: data.campaign,
            player: data.player,
            pendingBattle: null,
            canBattleToday: data.player.battlesRemainingToday > 0,
          };
        });

        setBattlePhase("result");
      } catch {
        setMessage("結算失敗，請稍後再試");
        setBattlePhase("fighting");
        setActionLocked(false);
      }
    },
    [battleId],
  );

  const handleAction = useCallback(
    async (moveId: string) => {
      if (battlePhase !== "fighting" || actionLocked) {
        return;
      }

      const selectedMove = GEN3_BATTLE_MOVESET.find((move) => move.id === moveId);
      if (!selectedMove) {
        return;
      }

      setActionLocked(true);

      const playerCritical = Math.random() < 0.12;
      const playerBaseDamage = selectedMove.power + Math.floor((Math.random() * 2 - 1) * selectedMove.variance);
      const playerHit = clamp(Math.floor(playerBaseDamage * (playerCritical ? 1.5 : 1)), 8, 70);

      const opponentMove = GEN3_BATTLE_MOVESET[Math.floor(Math.random() * GEN3_BATTLE_MOVESET.length)];
      const opponentCritical = Math.random() < 0.08;
      const opponentBaseDamage = opponentMove.power + Math.floor((Math.random() * 2 - 1) * opponentMove.variance);
      const opponentHit = clamp(Math.floor(opponentBaseDamage * (opponentCritical ? 1.45 : 1)), 6, 64);

      const nextTurns = turns + 1;
      let nextPlayerHp = playerHp;
      const nextOpponentHp = clamp(opponentHp - playerHit, 0, MAX_HP);
      const nextPlayerDamage = playerDamage + playerHit;
      let nextOpponentDamage = opponentDamage;

      const nextLogs = [
        ...battleLog,
        `第 ${nextTurns} 回合：你使用 ${selectedMove.label}，造成 ${playerHit} 傷害${playerCritical ? "（急所）" : ""}。`,
      ];

      let result: "won" | "lost" | null = null;

      if (nextOpponentHp <= 0) {
        result = "won";
        nextLogs.push("對手倒下，你贏得這場守衛戰。\n");
      } else {
        nextPlayerHp = clamp(playerHp - opponentHit, 0, MAX_HP);
        nextOpponentDamage += opponentHit;
        nextLogs.push(
          `對手反擊 ${opponentMove.label}，你受到 ${opponentHit} 傷害${opponentCritical ? "（急所）" : ""}。`,
        );

        if (nextPlayerHp <= 0) {
          result = "lost";
          nextLogs.push("你的隊伍失去戰鬥能力，本場判定落敗。\n");
        }
      }

      if (!result && nextTurns >= 12) {
        result = nextPlayerHp >= nextOpponentHp ? "won" : "lost";
        nextLogs.push("回合上限到達，依剩餘 HP 判定本場結果。\n");
      }

      setTurns(nextTurns);
      setPlayerHp(nextPlayerHp);
      setOpponentHp(nextOpponentHp);
      setPlayerDamage(nextPlayerDamage);
      setOpponentDamage(nextOpponentDamage);
      setBattleLog(nextLogs.slice(-24));

      if (result) {
        await submitBattleResult(result, nextTurns, nextPlayerDamage, nextOpponentDamage, nextLogs);
      } else {
        setActionLocked(false);
      }
    },
    [
      actionLocked,
      battleLog,
      battlePhase,
      opponentDamage,
      opponentHp,
      playerDamage,
      playerHp,
      submitBattleResult,
      turns,
    ],
  );

  const progressPercent = useMemo(() => {
    if (!player) {
      return 0;
    }

    return clamp((player.medalsCollected / Math.max(1, player.targetMedals)) * 100, 0, 100);
  }, [player]);

  if (loading) {
    return (
      <section className="glass-card p-8 text-center">
        <p className="animate-pulse text-white/60">載入活動資料中...</p>
      </section>
    );
  }

  if (!statusData || !campaign) {
    return (
      <section className="glass-card p-8 text-center">
        <p className="text-rose-200">活動資訊載入失敗，請稍後再試。</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">Battle Route</p>
          <h2 className="mt-1 text-base font-semibold text-white">伊布護衛活動・對戰匹配</h2>
        </div>
        <Link
          href="/eevee-guardian"
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/10"
        >
          返回活動入口
        </Link>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.18),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.16),transparent_42%),linear-gradient(160deg,#0f1220,#131a2d_45%,#0b111f)] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Eevee Medal Guardians</p>
        <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">{campaign.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
          你已經進入獨立對戰頁。開始匹配後會先隨機連線對手，再進入 3gen 戰鬥畫面。
          每日限定 {campaign.dailyBattles} 場，勝利獲得 {campaign.winPoints} 點，落敗獲得 {campaign.losePoints} 點。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            活動區間：{formatDate(campaign.startsAt)} - {formatDate(campaign.endsAt)}
          </span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            今日戰況輪詢：每 15 秒更新
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            Gen3 經典對戰入口已啟動（MVP）
          </span>
        </div>
      </section>

      {!statusData.tableReady ? (
        <section className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5 text-sm text-rose-100">
          <p className="font-semibold">活動資料庫尚未完成</p>
          <p className="mt-2 text-rose-100/80">
            {statusData.message || "請先執行本次新增的 Supabase migration，才能正常記錄進度與戰況。"}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="今日已對戰人數" value={statusData.live.todayBattlers} sub="即時更新" />
        <StatCard label="今日最高單場傷害" value={statusData.live.todayHighestDamage} sub="單場輸出" />
        <StatCard
          label="最高總累積傷害"
          value={statusData.live.highestTotalDamage}
          sub={statusData.live.highestTotalDamageDisplayName || "尚無資料"}
        />
        <StatCard label="活動進度" value={`${campaign.daysElapsed}/${campaign.totalDays}`} sub={`剩餘 ${campaign.daysRemaining} 天`} />
      </section>

      {player ? (
        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-white/45">你的勳章進度</p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {player.medalsCollected} / {player.targetMedals}
              </h2>
              <p className="mt-1 text-sm text-white/65">
                累積點數：{player.totalPoints.toFixed(1)} ・ 今日剩餘場次：{player.battlesRemainingToday}
              </p>
            </div>
            <div className="text-right text-sm text-white/65">
              <p>總戰績：{player.totalWins} 勝 / {player.totalLosses} 敗</p>
              <p>總輸出：{player.totalDamage}</p>
              <p>{player.rareRewardUnlocked ? "稀有伊布已解鎖" : "尚未達成獎勵門檻"}</p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">對戰匹配</h2>
            <p className="mt-1 text-sm text-white/60">
              先進行隨機匹配，再開始戰鬥。匹配成功後會進入三世代戰場介面。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startBattle()}
              disabled={!canStartBattle || actionLocked || battlePhase === "resolving" || isMatchmaking}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {statusData.pendingBattle ? "重新匹配並續戰" : "開始隨機匹配"}
            </button>
            {(battlePhase === "fighting" || battlePhase === "result") && (
              <button
                type="button"
                onClick={resetBattleLocalState}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                離開戰場
              </button>
            )}
          </div>
        </div>

        {!campaign.isActive ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            {campaign.hasEnded ? "活動已結束。" : "活動尚未開始。"}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {message}
          </p>
        ) : null}

        {(battlePhase === "fighting" || battlePhase === "resolving" || battlePhase === "result") && (
          <div className="mt-5 space-y-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-sm font-semibold text-emerald-200">你的隊伍</p>
                <HpBar current={playerHp} />
                <p className="mt-2 text-xs text-white/60">輸出：{playerDamage}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-sm font-semibold text-rose-200">對手隊伍</p>
                <HpBar current={opponentHp} />
                <p className="mt-2 text-xs text-white/60">輸出：{opponentDamage}</p>
              </div>
            </div>

            <p className="text-sm text-white/70">回合數：{turns} / 12</p>

            {battlePhase === "fighting" && (
              <div className="grid gap-3 md:grid-cols-2">
                {GEN3_BATTLE_MOVESET.map((move) => (
                  <button
                    key={move.id}
                    type="button"
                    onClick={() => void handleAction(move.id)}
                    disabled={actionLocked}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <p className="font-semibold">{move.label}</p>
                    <p className="mt-1 text-xs text-white/55">威力 {move.power} ・ 波動 {move.variance}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">Battle Log</p>
              <div className="mt-2 space-y-1">
                {battleLog.length === 0 ? (
                  <p className="text-sm text-white/45">等待行動...</p>
                ) : (
                  battleLog.map((line, index) => (
                    <p key={`${line}-${index}`} className="text-sm text-white/70">
                      {line}
                    </p>
                  ))
                )}
              </div>
            </div>

            {battlePhase === "resolving" ? (
              <p className="text-sm text-cyan-100">正在結算分數...</p>
            ) : null}

            {battlePhase === "result" && battleResult ? (
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="text-base font-bold">
                  {battleResult.result === "won" ? "本場勝利" : "本場落敗"}
                </p>
                <p className="mt-1">
                  取得 {battleResult.pointsAwarded} 點，造成 {battleResult.playerDamage} 傷害，共 {battleResult.turns} 回合。
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {isMatchmaking ? <MatchmakingOverlay opponentName={matchOpponent} /> : null}
    </div>
  );
}
