"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS,
  CHALLENGE_META,
  PARTNER_POKEMON_POOL,
  RETRO_BATTLE_MOVES,
  RETRO_MOVE_PP,
  RETRO_TYPE_LABEL_ZH,
  RETRO_VIRTUAL_OPPONENTS,
  getPokemonSpriteUrl,
  isBattleSessionExpired,
  type AnniversaryBattle,
  type RetroBattleState,
  type RetroMoveId,
  type RetroPokemonState,
  type RetroRoundResolution,
} from "@/lib/anniversary30th";

type PartnerInfo = { readonly id: string; readonly name: string; readonly sprite: string; readonly color: string };

type BattleConsoleProps = {
  partnerPokemon: PartnerInfo;
  partnerSpriteUrl: string;
  playerDisplayName: string;
  battlesRemaining: number;
  initialBattle: AnniversaryBattle | null;
};

type Phase = "idle" | "matchmaking" | "playing" | "round-result" | "finished";

type TurnAnimationStep = "idle" | "player-attack" | "opponent-hit" | "opponent-attack" | "player-hit" | "faint" | "timeout";

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
  pointsEarned?: number;
  battleState?: RetroBattleState | null;
  lastActiveAt?: string | null;
  battleStartedAt?: string | null;
  switched?: boolean;
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

function isTimeoutRoundPayload(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const payload = value as { timeout?: unknown; reason?: unknown };
  return payload.timeout === true || payload.reason === "timeout";
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function remainingBattleSeconds(battle: AnniversaryBattle | null) {
  const anchor = battle?.started_at;
  if (!anchor) return ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS;

  const startedAt = new Date(anchor).getTime();
  if (!Number.isFinite(startedAt)) return ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS;

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS - elapsed);
}

function hpPercent(current: number, max: number) {
  return clampPercent((Math.max(0, current) / Math.max(1, max)) * 100);
}

function hpTone(percent: number) {
  if (percent <= 20) return "bg-rose-500";
  if (percent <= 50) return "bg-amber-400";
  return "bg-emerald-500";
}

function typeLabel(type: RetroPokemonState["type"] | null | undefined) {
  return type ? RETRO_TYPE_LABEL_ZH[type] : "一般";
}

function getPartnerMeta(id: string | null | undefined, fallback: PartnerInfo) {
  return PARTNER_POKEMON_POOL.find((pokemon) => pokemon.id === id) ?? fallback;
}

function getOpponentMeta(id: string | null | undefined, battle: AnniversaryBattle | null) {
  const spriteId = id ?? battle?.opponent_sprite_id ?? "25";
  const match = RETRO_VIRTUAL_OPPONENTS.find((opponent) => opponent.spriteId === spriteId);

  return {
    trainerName: battle?.opponent_name ?? match?.name ?? "隨機對手",
    pokemonName: match?.pokemon ?? battle?.opponent_pokemon ?? "對手",
    spriteId: match?.spriteId ?? spriteId,
  };
}

function getActivePokemon(team: RetroPokemonState[] | undefined, activeIndex: number | undefined) {
  if (!team?.length) return null;
  return team[activeIndex ?? 0] ?? team.find((pokemon) => !pokemon.fainted) ?? team[0];
}

function getTaipeiHour() {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
}

function isTaipeiOffPeak() {
  const hour = getTaipeiHour();
  return hour >= 6 && hour < 11;
}

function BattleHpGauge({
  current,
  max,
  showNumbers = true,
}: {
  current: number;
  max: number;
  showNumbers?: boolean;
}) {
  const percent = hpPercent(current, max);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black leading-none text-slate-950">HP</span>
        <div className="h-3 flex-1 border-2 border-slate-950 bg-slate-200">
          <div className={`h-full ${hpTone(percent)}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
      {showNumbers ? (
        <p className="mt-1 text-right font-mono text-xs font-black tabular-nums text-slate-950">
          {Math.max(0, current)} / {Math.max(1, max)}
        </p>
      ) : null}
    </div>
  );
}

function PartyDots({
  team,
  activeIndex,
  slots,
}: {
  team: RetroPokemonState[];
  activeIndex: number;
  slots: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: slots }).map((_, index) => {
        const pokemon = team[index];
        const isActive = index === activeIndex && pokemon && !pokemon.fainted;
        const dotClass = !pokemon
          ? "border-slate-400 bg-transparent"
          : pokemon.fainted
            ? "border-slate-950 bg-slate-500"
            : isActive
              ? "border-slate-950 bg-emerald-500"
              : "border-slate-950 bg-slate-100";

        return (
          <span
            key={`${pokemon?.id ?? "empty"}-${index}`}
            className={`h-3 w-3 rounded-full border-2 ${dotClass}`}
            aria-label={pokemon ? `${pokemon.id}${pokemon.fainted ? " 已倒下" : ""}` : "空位"}
          />
        );
      })}
    </div>
  );
}

function StatusBox({
  pokemonName,
  typeName,
  hp,
  maxHp,
  team,
  activeIndex,
  slots,
  align = "left",
}: {
  pokemonName: string;
  typeName: string;
  hp: number;
  maxHp: number;
  team: RetroPokemonState[];
  activeIndex: number;
  slots: number;
  align?: "left" | "right";
}) {
  return (
    <div className="w-full max-w-[300px] border-4 border-slate-950 bg-[#f8f6dc] p-3 font-mono text-slate-950 shadow-[6px_6px_0_rgba(15,23,42,0.9)]">
      <div className="flex items-start justify-between gap-3">
        <div className={align === "right" ? "text-right" : ""}>
          <p className="text-sm font-black uppercase leading-none sm:text-base">{pokemonName}</p>
          <p className="mt-1 text-[11px] font-black leading-none text-slate-700">TYPE/{typeName}</p>
        </div>
        <p className="shrink-0 text-xs font-black leading-none">Lv50</p>
      </div>
      <div className="mt-3">
        <BattleHpGauge current={hp} max={maxHp} showNumbers={align === "right"} />
      </div>
      <div className={`mt-3 flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <PartyDots team={team} activeIndex={activeIndex} slots={slots} />
      </div>
    </div>
  );
}

function MatchmakingOverlay({
  partnerName,
  partnerSpriteUrl,
  playerDisplayName,
  onComplete,
}: {
  partnerName: string;
  partnerSpriteUrl: string;
  playerDisplayName: string;
  onComplete: () => void;
}) {
  const slowQueue = isTaipeiOffPeak();
  const [step, setStep] = useState(0);
  const steps = useMemo(
    () => slowQueue
      ? ["SEARCHING", "LINK CABLE", "TRAINER FOUND", "BATTLE READY"]
      : ["SEARCHING", "TRAINER FOUND", "BATTLE READY"],
    [slowQueue],
  );
  const activeStep = steps[Math.min(step, steps.length - 1)];

  useEffect(() => {
    const timers = steps.map((_, index) => (
      window.setTimeout(() => setStep(index), index * (slowQueue ? 850 : 520))
    ));
    const completion = window.setTimeout(onComplete, steps.length * (slowQueue ? 850 : 520) + 240);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(completion);
    };
  }, [onComplete, slowQueue, steps]);

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden border-4 border-[#f5f8df] bg-[#151b13] p-4 font-mono text-[#f5f8df] shadow-[10px_10px_0_rgba(0,0,0,0.45)] sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-20 animate-retro-scanline-roll"
          style={{
            backgroundImage: "linear-gradient(rgba(245,248,223,0.4) 1px, transparent 1px)",
            backgroundSize: "100% 8px",
          }}
        />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-[#f5f8df] pb-3">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">CABLE CLUB</p>
            <p className="text-xs font-black uppercase tracking-[0.18em]">{activeStep}</p>
          </div>

          <div className="mt-5 grid min-h-[230px] grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)] items-center gap-3 border-4 border-[#f5f8df] p-3 sm:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] sm:p-4">
            <div className="grid place-items-center gap-2 border-2 border-[#f5f8df] bg-[#263522] p-3">
              <p className="w-full truncate text-center text-xs font-black uppercase tracking-[0.14em]">
                {playerDisplayName}
              </p>
              <img
                src={partnerSpriteUrl}
                alt={partnerName}
                className="h-24 w-24 object-contain sm:h-32 sm:w-32"
                style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
              />
              <p className="w-full truncate text-center text-sm font-black">{partnerName}</p>
            </div>

            <div className="grid place-items-center gap-3">
              <span className="text-3xl font-black animate-retro-match-vs sm:text-5xl">VS</span>
              <div className="h-24 w-3 border-2 border-[#f5f8df] bg-[#f5f8df]/10">
                <div className="h-full w-full bg-emerald-300 animate-retro-link-pulse" />
              </div>
            </div>

            <div className="grid place-items-center gap-2 border-2 border-[#f5f8df] bg-[#263522] p-3">
              <p className="w-full truncate text-center text-xs font-black uppercase tracking-[0.14em]">
                LINK TRAINER
              </p>
              <div className="grid h-24 w-24 place-items-center border-2 border-[#f5f8df] bg-[#f5f8df]/10 sm:h-32 sm:w-32">
                <div className="h-16 w-12 border-4 border-[#f5f8df] bg-[#f5f8df]/20 animate-danger-pulse sm:h-20 sm:w-14" />
              </div>
              <p className="w-full truncate text-center text-sm font-black">
                {activeStep === "SEARCHING" ? "???" : "MATCH FOUND"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-black leading-6">
            {slowQueue ? "正在接上復古對戰線路，匹配完成後會立刻開始倒數。" : "匹配到訓練家後，指令倒數會直接啟動。"}
          </p>
          <div className="mt-4 grid grid-cols-12 gap-1">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className={`h-4 border border-[#f5f8df] ${index <= step * 4 ? "bg-emerald-300" : "bg-transparent"}`}
              />
            ))}
          </div>
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
  initialBattle,
}: BattleConsoleProps) {
  const activeInitialBattle = initialBattle && !isBattleSessionExpired(initialBattle.started_at || initialBattle.last_active_at)
    ? initialBattle
    : null;
  const meta = CHALLENGE_META.retro;
  const [phase, setPhase] = useState<Phase>(activeInitialBattle ? "playing" : "idle");
  const [battle, setBattle] = useState<AnniversaryBattle | null>(activeInitialBattle);
  const [liveBattleState, setLiveBattleState] = useState<RetroBattleState | null>(
    activeInitialBattle?.battle_state ?? null,
  );
  const [currentRound, setCurrentRound] = useState(() => (activeInitialBattle?.current_round ?? 0) + 1);
  const [playerScore, setPlayerScore] = useState(activeInitialBattle?.player_score ?? 0);
  const [opponentScore, setOpponentScore] = useState(activeInitialBattle?.opponent_score ?? 0);
  const [timeLeft, setTimeLeft] = useState(() => remainingBattleSeconds(activeInitialBattle));
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [turnAnimationStep, setTurnAnimationStep] = useState<TurnAnimationStep>("idle");
  const submittingActionRef = useRef<string | null>(null);
  const autoSubmittedRef = useRef(false);

  const resolution = useMemo(() => {
    if (!roundResult?.roundPayload) return null;
    return isRetroResolution(roundResult.roundPayload) ? roundResult.roundPayload : null;
  }, [roundResult]);
  const timeoutRound = useMemo(() => isTimeoutRoundPayload(roundResult?.roundPayload), [roundResult]);

  const playerTeam = liveBattleState?.player.team ?? [];
  const opponentTeam = liveBattleState?.opponent.team ?? [];
  const activePlayer = getActivePokemon(playerTeam, liveBattleState?.player.activeIndex);
  const activeOpponent = getActivePokemon(opponentTeam, liveBattleState?.opponent.activeIndex);
  const playerMeta = getPartnerMeta(activePlayer?.id, partnerPokemon);
  const opponentMeta = getOpponentMeta(activeOpponent?.id, battle);
  const playerSprite = getPokemonSpriteUrl(playerMeta.sprite);
  const opponentSprite = getPokemonSpriteUrl(opponentMeta.spriteId);
  const playerHp = activePlayer?.hp ?? resolution?.playerHp ?? 100;
  const playerMaxHp = activePlayer?.maxHp ?? resolution?.playerMaxHp ?? 100;
  const opponentHp = activeOpponent?.hp ?? resolution?.opponentHp ?? 100;
  const opponentMaxHp = activeOpponent?.maxHp ?? resolution?.opponentMaxHp ?? 100;
  const playerTypeName = typeLabel(activePlayer?.type ?? resolution?.playerType ?? null);
  const opponentTypeName = typeLabel(activeOpponent?.type ?? resolution?.opponentType ?? null);
  const playerActiveIndex = liveBattleState?.player.activeIndex ?? 0;
  const opponentActiveIndex = liveBattleState?.opponent.activeIndex ?? 0;
  const opponentSlots = Math.max(meta.winsNeeded, opponentTeam.length || 3);
  const playerSlots = Math.max(6, playerTeam.length || 1);
  const playerTeamRemaining = resolution?.playerTeamRemaining ?? (
    playerTeam.length > 0 ? playerTeam.filter((pokemon) => !pokemon.fainted).length : "--"
  );
  const opponentTeamRemaining = resolution?.opponentTeamRemaining ?? (
    opponentTeam.length > 0 ? opponentTeam.filter((pokemon) => !pokemon.fainted).length : "--"
  );
  const battleClockActive = Boolean(battle && (phase === "playing" || phase === "round-result"));
  const needsPlayerSwitch = Boolean(liveBattleState?.pendingPlayerSwitch && phase === "round-result" && !roundResult?.battleFinished);
  const timerPercent = clampPercent((timeLeft / ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS) * 100);
  const timerIsDanger = battleClockActive && timeLeft <= 5;
  const timerExpired = battleClockActive && timeLeft <= 0;
  const showTurnResolution = Boolean(resolution && (phase === "round-result" || phase === "finished"));
  const playerSpriteMotionClass = [
    "relative z-10 grid place-items-center",
    turnAnimationStep === "player-attack" ? "animate-retro-player-attack" : "",
    turnAnimationStep === "player-hit" || turnAnimationStep === "timeout" ? "animate-retro-hit-shake" : "",
    turnAnimationStep === "faint" && resolution?.playerFainted ? "animate-retro-faint" : "",
  ].filter(Boolean).join(" ");
  const opponentSpriteMotionClass = [
    "relative z-10 grid place-items-center",
    turnAnimationStep === "opponent-attack" ? "animate-retro-opponent-attack" : "",
    turnAnimationStep === "opponent-hit" ? "animate-retro-hit-shake" : "",
    turnAnimationStep === "faint" && resolution?.opponentFainted ? "animate-retro-faint" : "",
  ].filter(Boolean).join(" ");

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
      setLiveBattleState(nextBattle.battle_state ?? null);
      setPlayerScore(nextBattle.player_score ?? 0);
      setOpponentScore(nextBattle.opponent_score ?? 0);
      setCurrentRound((nextBattle.current_round ?? 0) + 1);
      setRoundResult(null);
      setPointsEarned(0);
      setTimeLeft(remainingBattleSeconds(nextBattle));
      setTurnAnimationStep("idle");
      autoSubmittedRef.current = false;
      setPhase("playing");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "無法建立對戰");
      setPhase("idle");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const submitRound = useCallback(async (action: RetroMoveId | "forfeit" | "timeout", roundNoOverride?: number) => {
    if (!battle || submittingActionRef.current) return;

    const submittedRound = roundNoOverride ?? currentRound;
    submittingActionRef.current = `${action}:${submittedRound}`;
    setSubmittingAction(`${action}:${submittedRound}`);
    setError("");

    try {
      const response = await fetch("/api/anniversary-30th/battle/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: battle.id,
          roundNo: submittedRound,
          action,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.battleExpired) {
          setPointsEarned(typeof payload.pointsEarned === "number" ? payload.pointsEarned : 0);
          setLiveBattleState(payload.battleState ?? null);
          setMessage(payload.error || "這場對戰已逾時。");
          setPhase("finished");
          return;
        }

        throw new Error(payload.error || "無法送出指令");
      }

      const result = payload as RoundResultData;
      setRoundResult(result);
      setCurrentRound(result.roundNo);
      setPlayerScore(result.playerScore);
      setOpponentScore(result.opponentScore);
      setLiveBattleState(result.battleState ?? null);

      setBattle((current) => current
        ? {
            ...current,
            current_round: result.roundNo,
            player_score: result.playerScore,
            opponent_score: result.opponentScore,
            status: result.battleFinished && result.battleResult ? result.battleResult : "in_progress",
            battle_state: result.battleState ?? current.battle_state,
            last_active_at: result.lastActiveAt ?? current.last_active_at,
            started_at: result.battleStartedAt ?? current.started_at,
          }
        : current);

      if (typeof result.pointsEarned === "number") {
        setPointsEarned(result.pointsEarned);
      }

      setPhase(result.battleFinished ? "finished" : "round-result");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "無法送出指令");
    } finally {
      submittingActionRef.current = null;
      setSubmittingAction(null);
    }
  }, [battle, currentRound]);

  const switchPokemon = useCallback(async (pokemonIndex: number) => {
    if (!battle || submittingActionRef.current) return;

    const nextRoundNo = Math.max((roundResult?.roundNo ?? currentRound) + 1, (battle.current_round ?? 0) + 1);
    const action = `switch:${pokemonIndex}`;
    submittingActionRef.current = action;
    setSubmittingAction(action);
    setError("");

    try {
      const response = await fetch("/api/anniversary-30th/battle/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: battle.id,
          roundNo: nextRoundNo,
          action,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.battleExpired) {
          setPointsEarned(typeof payload.pointsEarned === "number" ? payload.pointsEarned : 0);
          setLiveBattleState(payload.battleState ?? null);
          setMessage(payload.error || "換上寶可夢逾時，已判定戰敗。");
          setPhase("finished");
          return;
        }

        throw new Error(payload.error || "無法切換寶可夢");
      }

      const result = payload as RoundResultData;
      setLiveBattleState(result.battleState ?? null);
      setRoundResult(null);
      setMessage("");
      setError("");
      setCurrentRound(nextRoundNo);
      setTimeLeft(remainingBattleSeconds({
        ...battle,
        started_at: result.battleStartedAt ?? battle.started_at,
      }));

      setBattle((current) => current
        ? {
            ...current,
            battle_state: result.battleState ?? current.battle_state,
            last_active_at: result.lastActiveAt ?? current.last_active_at,
            started_at: result.battleStartedAt ?? current.started_at,
          }
        : current);
      setPhase("playing");
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "無法切換寶可夢");
    } finally {
      submittingActionRef.current = null;
      setSubmittingAction(null);
    }
  }, [battle, currentRound, roundResult?.roundNo]);

  useEffect(() => {
    if (!battle || !battleClockActive) return;

    const submitTimeout = () => {
      const nextRoundNo = phase === "round-result"
        ? Math.max((roundResult?.roundNo ?? currentRound) + 1, (battle.current_round ?? 0) + 1)
        : currentRound;

      void submitRound("timeout", nextRoundNo);
    };

    const tick = () => {
      const nextTime = remainingBattleSeconds(battle);
      setTimeLeft(nextTime);

      if (nextTime <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        submitTimeout();
      }
    };

    tick();
    const timer = window.setInterval(tick, 250);

    return () => window.clearInterval(timer);
  }, [battle, battleClockActive, currentRound, phase, roundResult?.roundNo, submitRound]);

  useEffect(() => {
    if (!resolution || (phase !== "round-result" && phase !== "finished")) {
      setTurnAnimationStep("idle");
      return;
    }

    const timers: number[] = [];
    const queueStep = (nextStep: TurnAnimationStep, delay: number) => {
      timers.push(window.setTimeout(() => setTurnAnimationStep(nextStep), delay));
    };

    if (timeoutRound) {
      setTurnAnimationStep("timeout");
      queueStep("idle", 820);
      return () => timers.forEach(window.clearTimeout);
    }

    setTurnAnimationStep("player-attack");
    queueStep("opponent-hit", 360);

    if (resolution.damageToPlayer > 0) {
      queueStep("opponent-attack", 840);
      queueStep("player-hit", 1180);
    }

    if (resolution.playerFainted || resolution.opponentFainted) {
      queueStep("faint", resolution.damageToPlayer > 0 ? 1560 : 820);
    } else {
      queueStep("idle", resolution.damageToPlayer > 0 ? 1640 : 920);
    }

    return () => timers.forEach(window.clearTimeout);
  }, [phase, resolution, roundResult?.roundNo, timeoutRound]);

  const beginMatchmaking = () => {
    if (battlesRemaining <= 0 || isStarting) return;
    setRoundResult(null);
    setTurnAnimationStep("idle");
    setTimeLeft(ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS);
    autoSubmittedRef.current = false;
    setPhase("matchmaking");
  };

  const continueBattle = () => {
    if (!battle) return;
    if (needsPlayerSwitch) {
      setError("請先從 PKMN 選單換上下一隻寶可夢。");
      return;
    }

    const nextRoundNo = (roundResult?.roundNo ?? currentRound) + 1;
    if (remainingBattleSeconds(battle) <= 0) {
      autoSubmittedRef.current = true;
      void submitRound("timeout", nextRoundNo);
      return;
    }

    setRoundResult(null);
    setTurnAnimationStep("idle");
    setTimeLeft(remainingBattleSeconds(battle));
    setMessage("");
    setError("");
    setCurrentRound(nextRoundNo);
    setPhase("playing");
  };

  const battleLines = useMemo(() => {
    if (message) return [message];
    if (!battle) {
      return [
        "LINK BATTLE 待機中。",
        "按下 START 後會先進入匹配畫面。",
      ];
    }
    if (phase === "playing") {
      return [
        currentRound === 1 ? `TRAINER ${opponentMeta.trainerName} 派出了 ${opponentMeta.pokemonName}!` : null,
        currentRound === 1 ? `上吧！${playerMeta.name}!` : null,
        timerIsDanger ? "全局戰鬥時間即將歸零，時間到會直接判負。" : `BATTLE CLOCK 正在倒數，要讓 ${playerMeta.name} 做什麼？`,
      ].filter((line): line is string => Boolean(line));
    }
    if (resolution) {
      if (needsPlayerSwitch) {
        return [
          resolution.message,
          `請在 ${timeLeft} 秒內從 PKMN 選單換上下一隻寶可夢。`,
        ];
      }
      if (timeoutRound) {
        if (turnAnimationStep === "timeout") {
          return ["TIME UP!", "你沒有在時限內下達指令。"];
        }
        if (turnAnimationStep === "player-hit") {
          return [`${opponentMeta.pokemonName} 抓住空檔取得主導!`, resolution.message];
        }
        return [resolution.message];
      }

      if (turnAnimationStep === "player-attack") {
        return [`${playerMeta.name} 使用了 ${resolution.playerMoveName}!`];
      }
      if (turnAnimationStep === "opponent-hit") {
        return [
          `${opponentMeta.pokemonName} 受到了 ${resolution.damageToOpponent} 傷害!`,
          resolution.effectivenessMessage || null,
          resolution.isCritical ? "命中要害！" : null,
        ].filter((line): line is string => Boolean(line));
      }
      if (turnAnimationStep === "opponent-attack") {
        return [`${opponentMeta.pokemonName} 使用了 ${resolution.opponentMoveName}!`];
      }
      if (turnAnimationStep === "player-hit") {
        return [
          `${playerMeta.name} 受到了 ${resolution.damageToPlayer} 傷害!`,
          resolution.opponentEffectivenessMessage || null,
          resolution.opponentCritical ? "命中要害！" : null,
        ].filter((line): line is string => Boolean(line));
      }

      return [
        `${playerMeta.name} 使用了 ${resolution.playerMoveName}!`,
        resolution.effectivenessMessage || null,
        resolution.isCritical ? "命中要害！" : null,
        `${opponentMeta.pokemonName} 使用了 ${resolution.opponentMoveName}!`,
        resolution.opponentEffectivenessMessage || null,
        resolution.opponentCritical ? "命中要害！" : null,
        resolution.message,
      ].filter((line): line is string => Boolean(line));
    }
    if (phase === "finished") {
      return [
        roundResult?.battleResult === "won" ? "你贏得了這場復古對戰！" : "你輸掉了這場復古對戰。",
      ].filter((line): line is string => Boolean(line));
    }
    return ["等待下一個指令。"];
  }, [
    battle,
    currentRound,
    message,
    opponentMeta.pokemonName,
    opponentMeta.trainerName,
    phase,
    playerMeta.name,
    resolution,
    roundResult,
    needsPlayerSwitch,
    timeoutRound,
    timerIsDanger,
    timeLeft,
    turnAnimationStep,
  ]);

  return (
    <section className="relative left-1/2 right-1/2 -my-10 -ml-[50vw] -mr-[50vw] min-h-[calc(100vh+5rem)] w-screen overflow-hidden bg-[#0b100b] px-2 py-3 text-white md:-my-12 md:min-h-[calc(100vh+6rem)] md:px-6 md:py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-20 animate-retro-scanline-roll"
        style={{
          backgroundImage: "linear-gradient(rgba(245,248,223,0.18) 1px, transparent 1px)",
          backgroundSize: "100% 8px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1080px] items-center">
        <div className="relative w-full border-4 border-[#d9e5bd] bg-[#50654e] p-2 shadow-[0_14px_0_rgba(0,0,0,0.55)] animate-retro-battle-pop">
          {phase === "matchmaking" ? (
            <MatchmakingOverlay
              partnerName={partnerPokemon.name}
              partnerSpriteUrl={partnerSpriteUrl}
              playerDisplayName={playerDisplayName}
              onComplete={startBattle}
            />
          ) : null}

          <div className="border-4 border-slate-950 bg-[#e7efd0] p-2 font-mono text-slate-950 md:p-4">
            <div className="border-b-4 border-slate-950 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.18em]">
                <span>GEN 1 LINK BATTLE</span>
                <span className={timerIsDanger ? "text-rose-700 animate-danger-pulse" : ""}>
                  TURN {String(currentRound).padStart(2, "0")} / BATTLE CLOCK {String(timeLeft).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-3 h-3 border-2 border-slate-950 bg-slate-200">
                <div
                  className={`h-full transition-[width] duration-200 ${timerIsDanger ? "bg-rose-600 stripe-bar" : "bg-slate-950"}`}
                  style={{ width: `${battleClockActive ? timerPercent : phase === "finished" ? 0 : 100}%` }}
                />
              </div>
            </div>

            {phase === "idle" ? (
              <div className="grid min-h-[520px] content-center gap-6 p-3 md:grid-cols-[minmax(0,1fr)_240px] md:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">LINK BATTLE</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
                    LINK TRAINER
                  </h2>
                  <div className="mt-6 max-w-xl border-4 border-slate-950 bg-[#f8f6dc] p-4 text-sm font-black uppercase leading-7 tracking-[0.08em]">
                    <p>&gt; WAITING FOR TRAINER</p>
                    <p>&gt; MATCHING BEFORE BATTLE</p>
                    <p>&gt; BATTLE CLOCK / {ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS} SEC</p>
                    <p>&gt; TIME UP = LOSE</p>
                  </div>
                  <button
                    type="button"
                    onClick={beginMatchmaking}
                    disabled={battlesRemaining <= 0 || isStarting}
                    className="mt-8 border-4 border-slate-950 bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#eef4d7] disabled:cursor-not-allowed disabled:bg-slate-500"
                  >
                    {isStarting ? "CONNECTING" : battlesRemaining > 0 ? "START BATTLE" : "NO BATTLE LEFT"}
                  </button>
                  {error ? <p className="mt-4 text-sm font-black text-rose-700">{error}</p> : null}
                </div>
                <div className="grid place-items-center">
                  <img
                    src={partnerSpriteUrl}
                    alt={partnerPokemon.name}
                    className="h-44 w-44 object-contain drop-shadow-[8px_10px_0_rgba(15,23,42,0.45)] md:h-56 md:w-56"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-3">
                <div className={`relative min-h-[390px] overflow-hidden border-4 border-slate-950 bg-[#edf3d5] p-3 sm:min-h-[430px] sm:p-5 ${
                  turnAnimationStep === "timeout" || turnAnimationStep === "player-hit" || turnAnimationStep === "opponent-hit"
                    ? "animate-retro-screen-jolt"
                    : ""
                }`}>
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20 animate-retro-scanline-roll"
                    style={{
                      backgroundImage: "linear-gradient(rgba(15,23,42,0.18) 1px, transparent 1px)",
                      backgroundSize: "100% 6px",
                    }}
                  />
                  {battleClockActive ? (
                    <div className={`absolute right-3 top-3 z-20 border-4 border-slate-950 bg-[#f8f6dc] px-3 py-2 text-right font-mono font-black ${timerIsDanger ? "text-rose-700 animate-danger-pulse" : "text-slate-950"}`}>
                      <p className="text-[10px] uppercase tracking-[0.16em]">BATTLE CLOCK</p>
                      <p className="text-2xl tabular-nums">{String(timeLeft).padStart(2, "0")}</p>
                    </div>
                  ) : null}
                  <div className="relative z-10 grid h-full min-h-[350px] grid-rows-[auto_1fr]">
                    <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
                      <StatusBox
                        pokemonName={opponentMeta.pokemonName}
                        typeName={opponentTypeName}
                        hp={opponentHp}
                        maxHp={opponentMaxHp}
                        team={opponentTeam}
                        activeIndex={opponentActiveIndex}
                        slots={opponentSlots}
                      />
                      <div className="grid place-items-center">
                        <div className={opponentSpriteMotionClass}>
                          {showTurnResolution && turnAnimationStep === "opponent-hit" && resolution && resolution.damageToOpponent > 0 ? (
                            <span className="absolute -left-5 top-4 z-20 border-2 border-slate-950 bg-[#f8f6dc] px-2 py-1 text-sm font-black text-rose-700 animate-pop-in">
                              -{resolution.damageToOpponent}
                            </span>
                          ) : null}
                          <img
                            src={opponentSprite}
                            alt={opponentMeta.pokemonName}
                            className="h-28 w-28 object-contain drop-shadow-[7px_10px_0_rgba(15,23,42,0.28)] sm:h-40 sm:w-40"
                            style={{ imageRendering: "pixelated" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-[130px_minmax(0,1fr)] items-end gap-4 sm:grid-cols-[190px_minmax(0,1fr)]">
                      <div className="relative grid min-h-[160px] place-items-end sm:min-h-[210px]">
                        <div className="absolute bottom-5 h-9 w-32 border-4 border-slate-950 bg-[#c8d6a4] sm:w-44" />
                        <div className={playerSpriteMotionClass}>
                          {showTurnResolution && (turnAnimationStep === "player-hit" || turnAnimationStep === "timeout") && resolution && resolution.damageToPlayer > 0 ? (
                            <span className="absolute -right-3 top-2 z-20 border-2 border-slate-950 bg-[#f8f6dc] px-2 py-1 text-sm font-black text-rose-700 animate-pop-in">
                              -{resolution.damageToPlayer}
                            </span>
                          ) : null}
                          <img
                            src={playerSprite}
                            alt={playerMeta.name}
                            className="h-32 w-32 object-contain drop-shadow-[7px_10px_0_rgba(15,23,42,0.28)] sm:h-48 sm:w-48"
                            style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <StatusBox
                          pokemonName={playerMeta.name}
                          typeName={playerTypeName}
                          hp={playerHp}
                          maxHp={playerMaxHp}
                          team={playerTeam}
                          activeIndex={playerActiveIndex}
                          slots={playerSlots}
                          align="right"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="min-h-[164px] border-4 border-slate-950 bg-[#f8f6dc] p-4 text-base font-black leading-7 text-slate-950 sm:text-lg">
                    {battleLines.map((line, index) => (
                      <p key={`${line}-${index}`}>{index === 0 ? ">" : ""} {line}</p>
                    ))}
                    {error ? <p className="mt-3 text-sm text-rose-700">&gt; {error}</p> : null}
                  </div>

                  <div className="min-h-[164px] border-4 border-slate-950 bg-[#f8f6dc] p-3 text-slate-950">
                    {phase === "playing" ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-black">
                          <span className="border-2 border-slate-950 bg-slate-950 px-2 py-1 text-[#eef4d7]">FIGHT</span>
                          <span className="border-2 border-slate-950 px-2 py-1 text-slate-400">PKMN</span>
                          <span className="border-2 border-slate-950 px-2 py-1 text-slate-400">ITEM</span>
                          <span className="border-2 border-slate-950 px-2 py-1 text-slate-400">RUN</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {RETRO_BATTLE_MOVES.map((move) => {
                            const ppRemaining = liveBattleState?.player.pp[move.id] ?? RETRO_MOVE_PP[move.id];
                            const submittingMove = submittingAction?.startsWith(`${move.id}:`) ?? false;
                            const disabled = submittingAction !== null || ppRemaining <= 0 || timerExpired;

                            return (
                              <button
                                key={move.id}
                                type="button"
                                onClick={() => void submitRound(move.id)}
                                disabled={disabled}
                                className="min-h-[74px] border-2 border-slate-950 bg-[#f8f6dc] p-2 text-left font-black disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                              >
                                <span className="block text-sm">{submittingMove ? "處理中" : move.name}</span>
                                <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                                  <span>TYPE/{move.type}</span>
                                  <span>PP {ppRemaining}/{RETRO_MOVE_PP[move.id]}</span>
                                </span>
                                <span className="mt-1 block text-[11px] text-slate-700">
                                  PWR {move.power} / ACC {move.accuracy}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {phase === "round-result" ? (
                      <div className="grid h-full content-between gap-3">
                        {needsPlayerSwitch ? (
                          <>
                            <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-black">
                              <span className="border-2 border-slate-950 px-2 py-1 text-slate-400">FIGHT</span>
                              <span className="border-2 border-slate-950 bg-slate-950 px-2 py-1 text-[#eef4d7]">PKMN</span>
                              <span className="border-2 border-slate-950 px-2 py-1 text-slate-400">ITEM</span>
                              <span className="border-2 border-slate-950 px-2 py-1 text-slate-400">RUN</span>
                            </div>
                            <div className="grid gap-2">
                              {playerTeam.map((pokemon, index) => {
                                const meta = getPartnerMeta(pokemon.id, partnerPokemon);
                                const canBattle = !pokemon.fainted && pokemon.hp > 0;
                                const submittingSwitch = submittingAction === `switch:${index}`;
                                const disabled = submittingAction !== null || timerExpired || !canBattle;

                                return (
                                  <button
                                    key={`${pokemon.id}-${index}`}
                                    type="button"
                                    onClick={() => void switchPokemon(index)}
                                    disabled={disabled}
                                    className="grid min-h-[46px] grid-cols-[1fr_auto] items-center gap-2 border-2 border-slate-950 bg-[#f8f6dc] px-3 py-2 text-left text-xs font-black disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                                  >
                                    <span>{submittingSwitch ? "換上中" : meta.name}</span>
                                    <span>HP {pokemon.hp}/{pokemon.maxHp}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-xs font-black">
                              <span className="border-2 border-slate-950 px-2 py-2">你擊倒 {playerScore}</span>
                              <span className="border-2 border-slate-950 px-2 py-2">對手擊倒 {opponentScore}</span>
                              <span className="border-2 border-slate-950 px-2 py-2">
                                我方剩 {playerTeamRemaining}
                              </span>
                              <span className="border-2 border-slate-950 px-2 py-2">
                                對手剩 {opponentTeamRemaining}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={continueBattle}
                              disabled={timerExpired || submittingAction !== null}
                              className="border-4 border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#eef4d7] disabled:cursor-not-allowed disabled:bg-slate-500"
                            >
                              NEXT TURN
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}

                    {phase === "finished" ? (
                      <div className="grid h-full content-between gap-3">
                        <div className="grid grid-cols-2 gap-2 text-xs font-black">
                          <span className="border-2 border-slate-950 px-2 py-2">BATTLE RESULT {roundResult?.battleResult === "won" ? "WIN" : "LOSE"}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">PAYOUT +{pointsEarned}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">PLAYER K.O. {playerScore}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">ENEMY K.O. {opponentScore}</span>
                        </div>
                        <Link
                          href="/random-distribution"
                          className="block border-4 border-slate-950 bg-slate-950 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-[#eef4d7]"
                        >
                          EXIT LINK
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
