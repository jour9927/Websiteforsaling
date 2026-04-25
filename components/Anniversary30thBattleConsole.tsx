"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS,
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  CHALLENGE_META,
  RETRO_BATTLE_MOVES,
  RETRO_VIRTUAL_OPPONENTS,
  getPokemonSpriteUrl,
  isBattleSessionExpired,
  type AnniversaryBattle,
  type RetroRoundResolution,
} from "@/lib/anniversary30th";

type PartnerInfo = { readonly id: string; readonly name: string; readonly sprite: string; readonly color: string };

type BattleConsoleProps = {
  partnerPokemon: PartnerInfo;
  partnerSpriteUrl: string;
  playerDisplayName: string;
  battlesRemaining: number;
  totalWins: number;
  winStreak: number;
  initialBattle: AnniversaryBattle | null;
  initialEventPoints: number;
};

type Phase = "idle" | "matchmaking" | "rules" | "playing" | "round-result" | "finished";

type RoundResultData = {
  roundNo: number;
  roundResult: "win" | "lose" | null;
  roundPayload: Record<string, unknown> | null;
  playerScore: number;
  opponentScore: number;
  battleFinished: boolean;
  battleResult: "won" | "lost" | null;
  partnerJustUnlocked?: boolean;
  challengeType?: string;
  totalRounds: number;
  winsNeeded: number;
  eventPoints?: number;
  pointsEarned?: number;
};

function isRetroResolution(value: unknown): value is RetroRoundResolution {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<RetroRoundResolution>;
  return (
    typeof payload.playerMoveName === "string" &&
    typeof payload.opponentMoveName === "string" &&
    typeof payload.damageToOpponent === "number" &&
    typeof payload.damageToPlayer === "number" &&
    typeof payload.playerHp === "number" &&
    typeof payload.opponentHp === "number" &&
    typeof payload.message === "string"
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW").format(Math.max(0, Math.floor(value)));
}

function HpBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const color = safeValue > 50 ? "bg-emerald-300" : safeValue > 20 ? "bg-amber-300" : "bg-rose-400";

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-950">
        <span>{label}</span>
        <span>{safeValue}/100</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-sm border-2 border-slate-950 bg-slate-200">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

type MatchPhase = "search-1" | "retry" | "search-2" | "found";

function isTaipeiOffPeakHour(): boolean {
  // 早上 06:00 - 11:00（台北時間）視為離峰，匹配變慢做出真實感
  const h = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return h >= 6 && h < 11;
}

function MatchmakingOverlay({ onComplete }: { onComplete: () => void }) {
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>("search-1");
  const slow = useMemo(() => isTaipeiOffPeakHour(), []);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((current) => current + 1), 160);
    const timeouts: number[] = [];

    if (slow) {
      // 早上時段：~21s 含一次假性「未匹配到 → 重新搜尋」
      timeouts.push(window.setTimeout(() => setPhase("retry"), 7000));
      timeouts.push(window.setTimeout(() => setPhase("search-2"), 10000));
      timeouts.push(window.setTimeout(() => setPhase("found"), 18000));
      timeouts.push(window.setTimeout(onComplete, 21000));
    } else {
      timeouts.push(window.setTimeout(() => setPhase("found"), 2400));
      timeouts.push(window.setTimeout(onComplete, 3300));
    }

    return () => {
      window.clearInterval(interval);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [onComplete, slow]);

  const opponent = RETRO_VIRTUAL_OPPONENTS[tick % RETRO_VIRTUAL_OPPONENTS.length];
  const found = phase === "found";

  const headline =
    phase === "found"
      ? "對手確認"
      : phase === "retry"
        ? "未匹配到對手"
        : phase === "search-2"
          ? "擴大搜尋範圍"
          : "搜尋對手中";

  const subline =
    phase === "found"
      ? "建立臨時對戰視窗..."
      : phase === "retry"
        ? "目前沒有玩家在線，正在重新搜尋..."
        : phase === "search-2"
          ? "已擴大至全平台搜尋..."
          : "正在連線至隨機配布戰場";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-5">
      <div className="w-full max-w-md rounded-lg border-4 border-slate-200 bg-[#d7e0c4] p-5 font-mono text-slate-950 shadow-[0_22px_80px_rgba(0,0,0,0.45)]">
        <div className="border-4 border-slate-950 bg-[#eef4d7] p-4">
          <p className="text-xs font-black tracking-[0.25em]">MATCHING</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className={`text-lg font-black ${phase === "retry" ? "text-red-700" : ""}`}>
                {headline}
              </p>
              {found && <p className="mt-2 text-sm">{opponent.name}的{opponent.pokemon}</p>}
            </div>
            <img
              src={found ? getPokemonSpriteUrl(opponent.spriteId) : getPokemonSpriteUrl("0")}
              alt={found ? opponent.pokemon : "搜尋中"}
              className={`h-20 w-20 object-contain transition-opacity duration-300 ${found ? "opacity-100" : "opacity-0"}`}
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div className="mt-5 grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }).map((_, index) => (
              <div
                key={index}
                className={`h-3 rounded-sm ${index <= tick % 24 || found ? "bg-slate-950" : "bg-slate-950/15"}`}
              />
            ))}
          </div>
          <p className={`mt-4 text-sm font-bold ${phase === "retry" ? "text-red-700" : ""}`}>
            {subline}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Anniversary30thBattleConsole({
  partnerPokemon,
  partnerSpriteUrl,
  playerDisplayName,
  battlesRemaining,
  totalWins,
  winStreak,
  initialBattle,
  initialEventPoints,
}: BattleConsoleProps) {
  const activeInitialBattle = initialBattle && !isBattleSessionExpired(initialBattle.last_active_at || initialBattle.started_at)
    ? initialBattle
    : null;
  const meta = CHALLENGE_META.retro;
  const playerBattleName = `${playerDisplayName}的${partnerPokemon.name}`;
  const [phase, setPhase] = useState<Phase>(activeInitialBattle ? "rules" : "idle");
  const [battle, setBattle] = useState<AnniversaryBattle | null>(activeInitialBattle);
  const [currentRound, setCurrentRound] = useState(() => Math.min(
    meta.totalRounds,
    (activeInitialBattle?.current_round ?? 0) + 1,
  ));
  const [playerScore, setPlayerScore] = useState(activeInitialBattle?.player_score ?? 0);
  const [opponentScore, setOpponentScore] = useState(activeInitialBattle?.opponent_score ?? 0);
  const [timeLeft, setTimeLeft] = useState(ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS);
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [eventPoints, setEventPoints] = useState(initialEventPoints);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const autoSubmittedRef = useRef(false);

  const resolution = useMemo(() => {
    if (!roundResult?.roundPayload) return null;
    return isRetroResolution(roundResult.roundPayload) ? roundResult.roundPayload : null;
  }, [roundResult]);

  const opponentSpriteUrl = getPokemonSpriteUrl(battle?.opponent_sprite_id || "25");
  const opponentBattleName = battle
    ? `${battle.opponent_name}的${battle.opponent_pokemon}`
    : "隨機對手";
  const progressPct = Math.min(100, Math.round((eventPoints / ANNIVERSARY_30TH_EEVEE_POINT_GOAL) * 100));

  const startBattle = useCallback(async () => {
    setIsStarting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/anniversary-30th/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "無法建立對戰");
      }

      const nextBattle = payload.battle as AnniversaryBattle;
      setBattle(nextBattle);
      setPlayerScore(nextBattle.player_score ?? 0);
      setOpponentScore(nextBattle.opponent_score ?? 0);
      setCurrentRound(Math.min(meta.totalRounds, (nextBattle.current_round ?? 0) + 1));
      setRoundResult(null);
      setPointsEarned(0);
      setPhase("rules");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "無法建立對戰");
      setPhase("idle");
    } finally {
      setIsStarting(false);
    }
  }, [meta.totalRounds]);

  const submitRound = useCallback(async (action: string) => {
    if (!battle || submittingAction) return;

    setSubmittingAction(action);
    setError("");

    try {
      const response = await fetch("/api/anniversary-30th/battle/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: battle.id,
          roundNo: currentRound,
          action,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.battleExpired) {
          setEventPoints(typeof payload.eventPoints === "number" ? payload.eventPoints : eventPoints);
          setPointsEarned(typeof payload.pointsEarned === "number" ? payload.pointsEarned : 0);
          setMessage(payload.error || "這場對戰已逾時。");
          setPhase("finished");
          return;
        }
        throw new Error(payload.error || "送出招式失敗");
      }

      const result = payload as RoundResultData;
      setRoundResult(result);
      setPlayerScore(result.playerScore);
      setOpponentScore(result.opponentScore);
      setEventPoints(typeof result.eventPoints === "number" ? result.eventPoints : eventPoints);
      setPointsEarned(typeof result.pointsEarned === "number" ? result.pointsEarned : 0);

      if (result.battleFinished) {
        setPhase("finished");
      } else {
        setPhase("round-result");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "送出招式失敗");
    } finally {
      setSubmittingAction(null);
    }
  }, [battle, currentRound, eventPoints, submittingAction]);

  useEffect(() => {
    if (phase !== "playing" || !battle || submittingAction) return;

    if (timeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void submitRound("timeout");
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [battle, phase, submitRound, submittingAction, timeLeft]);

  function beginPlaying() {
    autoSubmittedRef.current = false;
    setRoundResult(null);
    setMessage("");
    setError("");
    setTimeLeft(ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS);
    setPhase("playing");
  }

  function continueBattle() {
    setCurrentRound((round) => Math.min(meta.totalRounds, round + 1));
    beginPlaying();
  }

  const playerHp = resolution?.playerHp ?? 100;
  const opponentHp = resolution?.opponentHp ?? 100;
  const canStart = battlesRemaining > 0 && !isStarting;

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-[#111612] p-4 text-white md:p-6">
      {phase === "matchmaking" ? <MatchmakingOverlay onComplete={startBattle} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border-4 border-slate-200 bg-[#d7e0c4] p-3 font-mono text-slate-950 shadow-[inset_0_0_0_4px_rgba(15,23,42,0.25)] md:p-5">
          <div className="min-h-[430px] border-4 border-slate-950 bg-[#eef4d7] p-4">
            <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.18em]">
              <span>Random Distribution Battle</span>
              <span>{currentRound}/{meta.totalRounds}</span>
            </div>

            {phase === "idle" ? (
              <div className="mt-8 grid gap-8 md:grid-cols-[1fr_220px] md:items-center">
                <div>
                  <h1 className="text-3xl font-black leading-tight">復古掌機對戰</h1>
                  <p className="mt-4 text-sm font-bold leading-7">
                    點擊參與戰鬥後會進入匹配動畫，接著開啟臨時對戰視窗。每回合倒數 {ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS} 秒，未出招即判定棄權。
                  </p>
                  <button
                    type="button"
                    onClick={() => setPhase("matchmaking")}
                    disabled={!canStart}
                    className="mt-6 rounded border-4 border-slate-950 bg-slate-950 px-6 py-3 text-sm font-black text-[#eef4d7] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {battlesRemaining > 0 ? "參與戰鬥" : "今日場次已用完"}
                  </button>
                  {error ? <p className="mt-4 text-sm font-black text-rose-700">{error}</p> : null}
                </div>
                <div className="text-center">
                  <img
                    src={partnerSpriteUrl}
                    alt={partnerPokemon.name}
                    className="mx-auto h-32 w-32 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <p className="mt-3 break-words text-lg font-black">{playerBattleName}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded border-4 border-slate-950 bg-[#f5f8df] p-3">
                    <HpBar label={opponentBattleName} value={opponentHp} />
                    <img
                      src={opponentSpriteUrl}
                      alt={battle?.opponent_pokemon || "對手"}
                      className="ml-auto mt-4 h-28 w-28 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="rounded border-4 border-slate-950 bg-[#f5f8df] p-3">
                    <HpBar label={playerBattleName} value={playerHp} />
                    <img
                      src={partnerSpriteUrl}
                      alt={partnerPokemon.name}
                      className="mt-4 h-28 w-28 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="min-h-[142px] rounded border-4 border-slate-950 bg-[#f5f8df] p-4">
                    {phase === "rules" ? (
                      <>
                        <p className="text-lg font-black">對手出現了！</p>
                        <p className="mt-2 text-sm font-bold leading-6">
                          3 回合 2 勝。勝場得 2 分，敗場得 1 分。確認後開始倒數。
                        </p>
                        <button
                          type="button"
                          onClick={beginPlaying}
                          className="mt-4 rounded border-4 border-slate-950 bg-slate-950 px-5 py-2 text-sm font-black text-[#eef4d7]"
                        >
                          開始出招
                        </button>
                      </>
                    ) : phase === "playing" ? (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-lg font-black">選擇招式</p>
                          <p className="rounded border-4 border-slate-950 px-3 py-1 text-xl font-black tabular-nums">
                            {timeLeft}s
                          </p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {RETRO_BATTLE_MOVES.map((move) => (
                            <button
                              key={move.id}
                              type="button"
                              onClick={() => submitRound(move.id)}
                              disabled={Boolean(submittingAction)}
                              className="rounded border-4 border-slate-950 bg-[#eef4d7] px-3 py-2 text-left text-sm font-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
                            >
                              {move.name}
                              <span className="block text-xs font-bold opacity-70">
                                {move.type} / 威力 {move.power}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : phase === "round-result" && roundResult ? (
                      <>
                        <p className="text-lg font-black">
                          {roundResult.roundResult === "win" ? "這回合勝利" : "這回合落敗"}
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6">
                          {resolution
                            ? resolution.message
                            : "回合已記錄，準備進入下一回合。"}
                        </p>
                        <button
                          type="button"
                          onClick={continueBattle}
                          className="mt-4 rounded border-4 border-slate-950 bg-slate-950 px-5 py-2 text-sm font-black text-[#eef4d7]"
                        >
                          下一回合
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-black">
                          {roundResult?.battleResult === "won" ? "對戰勝利" : "對戰結束"}
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6">
                          {message || (roundResult?.battleResult === "won"
                            ? "你取得本場勝利，活動點數已更新。"
                            : "本場以落敗記錄，活動點數已更新。")}
                        </p>
                        {roundResult?.partnerJustUnlocked ? (
                          <p className="mt-3 rounded border-4 border-slate-950 bg-emerald-200 px-3 py-2 text-sm font-black">
                            已達成伊布 {ANNIVERSARY_30TH_EEVEE_POINT_GOAL} 分門檻。
                          </p>
                        ) : null}
                        <Link
                          href="/random-distribution"
                          className="mt-4 inline-flex rounded border-4 border-slate-950 bg-slate-950 px-5 py-2 text-sm font-black text-[#eef4d7]"
                        >
                          回活動頁
                        </Link>
                      </>
                    )}
                    {error ? <p className="mt-3 text-sm font-black text-rose-700">{error}</p> : null}
                  </div>

                  <div className="rounded border-4 border-slate-950 bg-[#f5f8df] p-4 text-sm font-black">
                    <div className="flex items-center justify-between">
                      <span>{playerBattleName}</span>
                      <span>{playerScore}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span>{opponentBattleName}</span>
                      <span>{opponentScore}</span>
                    </div>
                    <div className="mt-4 border-t-4 border-slate-950 pt-3">
                      <p>本場需 {meta.winsNeeded} 勝</p>
                      <p className="mt-1">今日剩餘 {Math.max(0, battlesRemaining)} 場</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-white/12 bg-black/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
              活動點數
            </p>
            <p className="mt-3 font-mono text-4xl font-black tabular-nums">
              {formatNumber(eventPoints)}
              <span className="text-base text-white/45"> / {ANNIVERSARY_30TH_EEVEE_POINT_GOAL}</span>
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-sm bg-white/10">
              <div className="h-full bg-emerald-300" style={{ width: `${progressPct}%` }} />
            </div>
            {pointsEarned > 0 ? (
              <p className="mt-2 text-sm text-emerald-200">本場 +{pointsEarned} 分</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-white/12 bg-black/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
              戰績
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/45">累積勝場</p>
                <p className="mt-1 font-mono text-2xl font-black">{formatNumber(totalWins)}</p>
              </div>
              <div>
                <p className="text-white/45">目前連勝</p>
                <p className="mt-1 font-mono text-2xl font-black">{formatNumber(winStreak)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/12 bg-black/35 p-4 text-sm leading-6 text-white/60">
            <p className="font-bold text-white">對戰規則</p>
            <p className="mt-2">{meta.description}</p>
            <p className="mt-2">倒數歸零會自動送出棄權，本場直接以落敗記錄。</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
