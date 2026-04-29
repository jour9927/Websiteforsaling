"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS,
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
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
  battleState?: RetroBattleState | null;
  lastActiveAt?: string | null;
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

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
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

function PartyRoster({
  title,
  team,
  activeIndex,
  slots,
  getName,
}: {
  title: string;
  team: RetroPokemonState[];
  activeIndex: number;
  slots: number;
  getName: (pokemon: RetroPokemonState) => string;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-black/35 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">{title}</p>
      <div className="mt-3 space-y-2">
        {Array.from({ length: slots }).map((_, index) => {
          const pokemon = team[index];
          const percent = pokemon ? hpPercent(pokemon.hp, pokemon.maxHp) : 0;

          return (
            <div
              key={`${pokemon?.id ?? "empty"}-${index}`}
              className={`border px-3 py-2 text-sm ${
                index === activeIndex && pokemon && !pokemon.fainted
                  ? "border-emerald-300 bg-emerald-300/12 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/75"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{pokemon ? getName(pokemon) : "EMPTY"}</span>
                <span className="font-mono text-xs tabular-nums">
                  {pokemon ? `${Math.max(0, pokemon.hp)}/${pokemon.maxHp}` : "--"}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10">
                <div
                  className={pokemon ? hpTone(percent) : "bg-transparent"}
                  style={{ width: `${percent}%`, height: "100%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchmakingOverlay({ partnerName, onComplete }: { partnerName: string; onComplete: () => void }) {
  const slowQueue = isTaipeiOffPeak();
  const [step, setStep] = useState(0);
  const steps = useMemo(
    () => slowQueue
      ? ["SEARCHING", "LINKING CABLE", "WAITING TRAINER", "BATTLE READY"]
      : ["SEARCHING", "TRAINER FOUND", "BATTLE READY"],
    [slowQueue],
  );

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
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/75 p-4">
      <div className="w-full max-w-md border-4 border-[#f5f8df] bg-[#151b13] p-5 font-mono text-[#f5f8df] shadow-[10px_10px_0_rgba(0,0,0,0.45)]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">CABLE CLUB</p>
        <div className="mt-5 border-4 border-[#f5f8df] p-4">
          <p className="text-lg font-black">{steps[step]}</p>
          <p className="mt-3 text-sm font-black leading-6">
            {partnerName} 已進入對戰端子。{slowQueue ? "清晨佇列較慢，正在等待對手回應。" : "正在配對隨機訓練家。"}
          </p>
          <div className="mt-5 grid grid-cols-12 gap-1">
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
  totalWins,
  winStreak,
  initialBattle,
  initialEventPoints,
}: BattleConsoleProps) {
  const activeInitialBattle = initialBattle && !isBattleSessionExpired(initialBattle.last_active_at || initialBattle.started_at)
    ? initialBattle
    : null;
  const meta = CHALLENGE_META.retro;
  const [phase, setPhase] = useState<Phase>(activeInitialBattle ? "rules" : "idle");
  const [battle, setBattle] = useState<AnniversaryBattle | null>(activeInitialBattle);
  const [liveBattleState, setLiveBattleState] = useState<RetroBattleState | null>(
    activeInitialBattle?.battle_state ?? null,
  );
  const [currentRound, setCurrentRound] = useState(() => (activeInitialBattle?.current_round ?? 0) + 1);
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

  const playerTeam = liveBattleState?.player.team ?? [];
  const opponentTeam = liveBattleState?.opponent.team ?? [];
  const activePlayer = getActivePokemon(playerTeam, liveBattleState?.player.activeIndex);
  const activeOpponent = getActivePokemon(opponentTeam, liveBattleState?.opponent.activeIndex);
  const playerMeta = getPartnerMeta(activePlayer?.id, partnerPokemon);
  const opponentMeta = getOpponentMeta(activeOpponent?.id, battle);
  const playerBattleName = `${playerDisplayName}的${playerMeta.name}`;
  const opponentBattleName = battle
    ? `${opponentMeta.trainerName}的${opponentMeta.pokemonName}`
    : "隨機對手";
  const playerSprite = getPokemonSpriteUrl(playerMeta.sprite);
  const opponentSprite = getPokemonSpriteUrl(opponentMeta.spriteId);
  const playerHp = activePlayer?.hp ?? resolution?.playerHp ?? 100;
  const playerMaxHp = activePlayer?.maxHp ?? resolution?.playerMaxHp ?? 100;
  const opponentHp = activeOpponent?.hp ?? resolution?.opponentHp ?? 100;
  const opponentMaxHp = activeOpponent?.maxHp ?? resolution?.opponentMaxHp ?? 100;
  const playerTypeName = typeLabel(activePlayer?.type ?? resolution?.playerType ?? null);
  const opponentTypeName = typeLabel(activeOpponent?.type ?? resolution?.opponentType ?? null);
  const progressPct = Math.min(100, Math.round((eventPoints / ANNIVERSARY_30TH_EEVEE_POINT_GOAL) * 100));
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
      setPhase("rules");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "無法建立對戰");
      setPhase("idle");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const submitRound = useCallback(async (action: RetroMoveId | "forfeit") => {
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
          setLiveBattleState(payload.battleState ?? null);
          setMessage(payload.error || "這場對戰已逾時。");
          setPhase("finished");
          return;
        }

        throw new Error(payload.error || "無法送出指令");
      }

      const result = payload as RoundResultData;
      setRoundResult(result);
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
          }
        : current);

      if (typeof result.eventPoints === "number") {
        setEventPoints(result.eventPoints);
      }
      if (typeof result.pointsEarned === "number") {
        setPointsEarned(result.pointsEarned);
      }

      setPhase(result.battleFinished ? "finished" : "round-result");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "無法送出指令");
    } finally {
      setSubmittingAction(null);
    }
  }, [battle, currentRound, eventPoints, submittingAction]);

  useEffect(() => {
    if (phase !== "playing") return;

    setTimeLeft(ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS);
    autoSubmittedRef.current = false;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const nextTime = Math.max(0, ANNIVERSARY_30TH_BATTLE_SESSION_TIMEOUT_SECONDS - elapsed);
      setTimeLeft(nextTime);

      if (nextTime <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void submitRound("forfeit");
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [currentRound, phase, submitRound]);

  const beginMatchmaking = () => {
    if (battlesRemaining <= 0 || isStarting) return;
    setPhase("matchmaking");
  };

  const beginPlaying = () => {
    setMessage("");
    setError("");
    setPhase("playing");
  };

  const continueBattle = () => {
    setRoundResult(null);
    setCurrentRound((round) => round + 1);
    beginPlaying();
  };

  const battleLines = useMemo(() => {
    if (message) return [message];
    if (!battle) {
      return [
        "連線到隨機配布對戰中心。",
        "選好夥伴後即可進入復古掌機對戰。",
      ];
    }
    if (phase === "rules") {
      return [
        `TRAINER ${opponentMeta.trainerName} 派出了 ${opponentMeta.pokemonName}!`,
        `上吧！${playerMeta.name}!`,
      ];
    }
    if (phase === "playing") {
      return [`要讓 ${playerMeta.name} 做什麼？`];
    }
    if (resolution) {
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
        roundResult?.partnerJustUnlocked ? "連勝條件達成，夥伴永久解鎖！" : null,
      ].filter((line): line is string => Boolean(line));
    }
    return ["等待下一個指令。"];
  }, [battle, message, opponentMeta.pokemonName, opponentMeta.trainerName, phase, playerMeta.name, resolution, roundResult]);

  return (
    <section className="relative overflow-hidden rounded-lg border border-emerald-300/20 bg-[#0d130e] p-3 text-white shadow-2xl md:p-5">
      {phase === "matchmaking" ? (
        <MatchmakingOverlay partnerName={partnerPokemon.name} onComplete={startBattle} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="border-4 border-[#d9e5bd] bg-[#50654e] p-2 shadow-[0_14px_0_rgba(0,0,0,0.35)]">
          <div className="border-4 border-slate-950 bg-[#e7efd0] p-2 font-mono text-slate-950 md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-slate-950 pb-3 text-xs font-black uppercase tracking-[0.18em]">
              <span>RANDOM EEVEE LINK</span>
              <span className={phase === "playing" && timeLeft <= 5 ? "text-rose-700" : ""}>
                TURN {String(currentRound).padStart(2, "0")} / TIME {String(timeLeft).padStart(2, "0")}
              </span>
            </div>

            {phase === "idle" ? (
              <div className="grid min-h-[520px] content-center gap-6 p-3 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">POKEMON CENTER</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
                    隨機型伊布配布對戰
                  </h2>
                  <p className="mt-5 max-w-xl text-base font-black leading-8">
                    以一代對戰框重建指令節奏：HP、PP、屬性、隊伍倒下狀態都會在同一個戰鬥畫面內更新。
                  </p>
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
                <div className="relative min-h-[390px] overflow-hidden border-4 border-slate-950 bg-[#edf3d5] p-3 sm:min-h-[430px] sm:p-5">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "linear-gradient(rgba(15,23,42,0.18) 1px, transparent 1px)",
                      backgroundSize: "100% 6px",
                    }}
                  />
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
                        <img
                          src={opponentSprite}
                          alt={opponentMeta.pokemonName}
                          className="h-28 w-28 object-contain drop-shadow-[7px_10px_0_rgba(15,23,42,0.28)] sm:h-40 sm:w-40"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-[130px_minmax(0,1fr)] items-end gap-4 sm:grid-cols-[190px_minmax(0,1fr)]">
                      <div className="relative grid min-h-[160px] place-items-end sm:min-h-[210px]">
                        <div className="absolute bottom-5 h-9 w-32 border-4 border-slate-950 bg-[#c8d6a4] sm:w-44" />
                        <img
                          src={playerSprite}
                          alt={playerMeta.name}
                          className="relative z-10 h-32 w-32 object-contain drop-shadow-[7px_10px_0_rgba(15,23,42,0.28)] sm:h-48 sm:w-48"
                          style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
                        />
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
                    {phase === "rules" ? (
                      <div className="grid h-full content-between gap-3">
                        <div className="grid grid-cols-2 gap-2 text-sm font-black">
                          <span className="border-2 border-slate-950 px-3 py-2">FIGHT</span>
                          <span className="border-2 border-slate-950 px-3 py-2 text-slate-400">PKMN</span>
                          <span className="border-2 border-slate-950 px-3 py-2 text-slate-400">ITEM</span>
                          <span className="border-2 border-slate-950 px-3 py-2 text-slate-400">RUN</span>
                        </div>
                        <button
                          type="button"
                          onClick={beginPlaying}
                          className="border-4 border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#eef4d7]"
                        >
                          SELECT FIGHT
                        </button>
                      </div>
                    ) : null}

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
                            const disabled = submittingAction !== null || ppRemaining <= 0;

                            return (
                              <button
                                key={move.id}
                                type="button"
                                onClick={() => void submitRound(move.id)}
                                disabled={disabled}
                                className="min-h-[74px] border-2 border-slate-950 bg-[#f8f6dc] p-2 text-left font-black disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                              >
                                <span className="block text-sm">{submittingAction === move.id ? "處理中" : move.name}</span>
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
                        <div className="grid grid-cols-2 gap-2 text-xs font-black">
                          <span className="border-2 border-slate-950 px-2 py-2">你的KO {playerScore}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">對手KO {opponentScore}</span>
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
                          className="border-4 border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#eef4d7]"
                        >
                          NEXT TURN
                        </button>
                      </div>
                    ) : null}

                    {phase === "finished" ? (
                      <div className="grid h-full content-between gap-3">
                        <div className="grid grid-cols-2 gap-2 text-xs font-black">
                          <span className="border-2 border-slate-950 px-2 py-2">結果 {roundResult?.battleResult === "won" ? "WIN" : "LOSE"}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">本場 +{pointsEarned}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">你的KO {playerScore}</span>
                          <span className="border-2 border-slate-950 px-2 py-2">對手KO {opponentScore}</span>
                        </div>
                        <Link
                          href="/random-distribution"
                          className="block border-4 border-slate-950 bg-slate-950 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-[#eef4d7]"
                        >
                          BACK EVENT
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-white/12 bg-black/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">活動點數</p>
            <p className="mt-3 font-mono text-4xl font-black tabular-nums">
              {formatNumber(eventPoints)}
              <span className="text-base text-white/45"> / {ANNIVERSARY_30TH_EEVEE_POINT_GOAL}</span>
            </p>
            <div className="mt-3 h-3 overflow-hidden bg-white/10">
              <div className="h-full bg-emerald-300" style={{ width: `${progressPct}%` }} />
            </div>
            {pointsEarned > 0 ? <p className="mt-2 text-sm text-emerald-200">本場 +{pointsEarned} 分</p> : null}
          </div>

          <div className="rounded-lg border border-white/12 bg-black/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">對戰紀錄</p>
            <div className="mt-3 space-y-2 border border-white/10 bg-white/[0.03] p-3 text-sm">
              <p className="truncate font-semibold text-white">{playerBattleName}</p>
              <p className="truncate text-white/65">VS {opponentBattleName}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="font-mono text-2xl font-black">{totalWins}</p>
                <p className="mt-1 text-[11px] text-white/50">TOTAL</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="font-mono text-2xl font-black">{winStreak}</p>
                <p className="mt-1 text-[11px] text-white/50">STREAK</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="font-mono text-2xl font-black">{Math.max(0, battlesRemaining)}</p>
                <p className="mt-1 text-[11px] text-white/50">LEFT</p>
              </div>
            </div>
          </div>

          <PartyRoster
            title="PLAYER PARTY"
            team={playerTeam}
            activeIndex={playerActiveIndex}
            slots={playerSlots}
            getName={(pokemon) => getPartnerMeta(pokemon.id, partnerPokemon).name}
          />

          <PartyRoster
            title="OPPONENT PARTY"
            team={opponentTeam}
            activeIndex={opponentActiveIndex}
            slots={opponentSlots}
            getName={(pokemon) => getOpponentMeta(pokemon.id, battle).pokemonName}
          />
        </aside>
      </div>
    </section>
  );
}
