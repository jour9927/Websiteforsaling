"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHALLENGE_META,
  SLOT_FACES,
  SLOT_FACE_META,
  VIRTUAL_OPPONENTS,
  getPokemonSpriteUrl,
  isBattleSessionExpired,
  pickTriviaQuestions,
  type AnniversaryBattle,
  type ChallengeType,
  type SlotSymbol,
  type TriviaQuestion,
} from "@/lib/anniversary30th";

type PartnerInfo = { id: string; name: string; sprite: string; color: string };

type BattleConsoleProps = {
  partnerPokemon: PartnerInfo;
  partnerSpriteUrl: string;
  playerDisplayName: string;
  battlesRemaining: number;
  totalWins: number;
  winStreak: number;
  initialBattle: AnniversaryBattle | null;
};

type Phase = "idle" | "matchmaking" | "rules" | "playing" | "round-result" | "finished";

type RoundResultData = {
  roundNo: number;
  roundResult: "win" | "lose";
  roundPayload: Record<string, unknown>;
  playerScore: number;
  opponentScore: number;
  battleFinished: boolean;
  battleResult: string | null;
  partnerJustUnlocked: boolean;
  secondPokemonJustUnlocked: boolean;
  totalRounds: number;
};

// ─── Matchmaking Animation ───
function MatchmakingOverlay({ onComplete }: { onComplete: () => void }) {
  const [tick, setTick] = useState(0);
  const [found, setFound] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 200);
    const foundTimer = setTimeout(() => {
      setFound(true);
      setTimeout(onComplete, 1500);
    }, 3500);
    return () => {
      clearInterval(timer);
      clearTimeout(foundTimer);
    };
  }, [onComplete]);

  const opponent = VIRTUAL_OPPONENTS[tick % VIRTUAL_OPPONENTS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8">
        {!found ? (
          <>
            {/* Radar scan effect */}
            <div className="relative flex h-32 w-32 items-center justify-center">
              {/* Radar rings */}
              <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-radar-ring" />
              <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-radar-ring" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-radar-ring" style={{ animationDelay: "1s" }} />
              {/* Sweep line */}
              <div className="absolute inset-0 animate-scan-rotate" style={{ transformOrigin: "center" }}>
                <div className="absolute left-1/2 top-0 h-1/2 w-0.5 origin-bottom bg-gradient-to-t from-amber-400/60 to-transparent" />
              </div>
              {/* Pokemon sprite */}
              <img
                key={opponent.spriteId}
                src={getPokemonSpriteUrl(opponent.spriteId)}
                alt="matching"
                className="relative z-10 h-20 w-20 object-contain drop-shadow-[0_0_16px_rgba(251,191,36,0.4)] transition-all duration-150"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-lg font-bold text-white">正在尋找對手...</p>
            <p className="text-sm text-white/50">掃描附近的訓練家中</p>
          </>
        ) : (
          <div className="animate-pop-in flex flex-col items-center gap-4">
            <div className="relative">
              <div className="text-5xl">⚔️</div>
              <div className="absolute inset-0 animate-ping text-5xl opacity-30">⚔️</div>
            </div>
            <p className="text-3xl font-black text-amber-300 animate-glow-pulse">對手已找到！</p>
            <p className="text-sm text-white/60">準備進入戰場...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rules Popup (15 seconds) ───
function RulesPopup({
  challengeType,
  onStart,
}: {
  challengeType: ChallengeType;
  onStart: () => void;
}) {
  const [countdown, setCountdown] = useState(15);
  const meta = CHALLENGE_META[challengeType];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          onStart();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-3xl border border-amber-400/30 bg-[linear-gradient(160deg,#1a1530,#0d1a2a)] p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-4xl">{challengeType === "dice" ? "⚄" : challengeType === "trivia" ? "🧠" : "🎰"}</p>
          <h2 className="mt-4 text-2xl font-black text-white">{meta.label}</h2>
          <p className="mt-4 text-sm leading-7 text-white/70">{meta.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-2xl font-bold text-amber-300">{meta.totalRounds}</p>
              <p className="text-[10px] text-white/50">回合</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-2xl font-bold text-emerald-300">{meta.winsNeeded}</p>
              <p className="text-[10px] text-white/50">勝場</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-2xl font-bold text-rose-300">{meta.timeLimit}s</p>
              <p className="text-[10px] text-white/50">每回合</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                style={{ width: `${(countdown / 15) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">{countdown} 秒後自動開始</p>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-base font-bold text-white transition hover:brightness-110"
          >
            我準備好了！
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Time Bar ───
function TimeBar({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) {
  const pct = (timeLeft / maxTime) * 100;
  const isLow = timeLeft <= 3;
  const isMid = timeLeft <= 5;

  return (
    <div className={`mb-4 rounded-xl p-3 transition-all duration-300 ${isLow ? "animate-danger-pulse bg-rose-500/5" : "bg-transparent"}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">⏱️ 剩餘時間</span>
        <span className={`font-bold tabular-nums ${isLow ? "text-rose-400 text-base" : "text-white/70"}`}>
          {isLow && "⚠️ "}{timeLeft}s
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isLow ? "bg-rose-500" : isMid ? "bg-amber-500" : "bg-emerald-500"
          } ${isLow ? "stripe-bar" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── VS Header ───
function VSHeader({
  playerSprite,
  playerName,
  opponentSprite,
  opponentName,
  playerScore,
  opponentScore,
  isAttacking,
}: {
  playerSprite: string;
  playerName: string;
  opponentSprite: string;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
  isAttacking: boolean;
}) {
  const [prevPlayerScore, setPrevPlayerScore] = useState(playerScore);
  const [prevOpponentScore, setPrevOpponentScore] = useState(opponentScore);
  const [playerScorePop, setPlayerScorePop] = useState(false);
  const [opponentScorePop, setOpponentScorePop] = useState(false);

  useEffect(() => {
    if (playerScore !== prevPlayerScore) {
      setPlayerScorePop(true);
      setPrevPlayerScore(playerScore);
      const t = setTimeout(() => setPlayerScorePop(false), 350);
      return () => clearTimeout(t);
    }
  }, [playerScore, prevPlayerScore]);

  useEffect(() => {
    if (opponentScore !== prevOpponentScore) {
      setOpponentScorePop(true);
      setPrevOpponentScore(opponentScore);
      const t = setTimeout(() => setOpponentScorePop(false), 350);
      return () => clearTimeout(t);
    }
  }, [opponentScore, prevOpponentScore]);

  return (
    <div className={`relative flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-blue-900/30 via-black/40 to-red-900/30 p-4 ${isAttacking ? "animate-hit-shake" : ""}`}>
      {/* Player */}
      <div className="flex flex-col items-center gap-2">
        <div className={`relative h-20 w-20 transition-transform duration-500 ${isAttacking ? "translate-x-8 scale-125" : ""}`}>
          <img src={playerSprite} alt={playerName} className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(96,165,250,0.4)]" />
          {isAttacking && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-2xl animate-ping">💥</div>
          )}
        </div>
        <p className="max-w-[100px] truncate text-xs font-bold text-blue-200">{playerName}</p>
        <div className={`rounded-full bg-blue-500/20 px-3 py-0.5 text-sm font-bold text-blue-300 ${playerScorePop ? "animate-score-pop" : ""}`}>
          {playerScore}
        </div>
      </div>

      {/* VS */}
      <div className="flex flex-col items-center">
        <span className={`text-3xl font-black transition-all duration-500 ${isAttacking ? "scale-150 text-amber-300 animate-glow-pulse" : "text-white/30"}`}>
          VS
        </span>
      </div>

      {/* Opponent */}
      <div className="flex flex-col items-center gap-2">
        <div className={`relative h-20 w-20 transition-transform duration-500 ${isAttacking ? "-translate-x-8 scale-125" : ""}`}>
          <img src={opponentSprite} alt={opponentName} className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(239,68,68,0.4)]" />
        </div>
        <p className="max-w-[100px] truncate text-xs font-bold text-rose-200">{opponentName}</p>
        <div className={`rounded-full bg-rose-500/20 px-3 py-0.5 text-sm font-bold text-rose-300 ${opponentScorePop ? "animate-score-pop" : ""}`}>
          {opponentScore}
        </div>
      </div>
    </div>
  );
}

// ─── Dice Face ───
const DICE_DOTS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceFace({ value, color = "white", size = "lg" }: { value: number; color?: "white" | "blue" | "red"; size?: "sm" | "lg" }) {
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  const dotColors = { white: "bg-white", blue: "bg-blue-300", red: "bg-rose-300" };
  const borderColors = { white: "border-white/20", blue: "border-blue-400/30", red: "border-rose-400/30" };
  const bgColors = { white: "from-slate-700 to-slate-800", blue: "from-blue-900/60 to-blue-950/60", red: "from-rose-900/60 to-rose-950/60" };
  const dim = size === "lg" ? "h-20 w-20" : "h-14 w-14";
  const dotSize = size === "lg" ? "h-3 w-3" : "h-2 w-2";

  return (
    <div className={`${dim} rounded-xl border ${borderColors[color]} bg-gradient-to-br ${bgColors[color]} p-2 shadow-lg`}>
      <div className="grid h-full w-full grid-cols-3 grid-rows-3">
        {[0, 1, 2].map(row =>
          [0, 1, 2].map(col => (
            <div key={`${row}-${col}`} className="flex items-center justify-center">
              {dots.some(([r, c]) => r === row && c === col) && (
                <div className={`${dotSize} rounded-full ${dotColors[color]} shadow-[0_0_6px_rgba(255,255,255,0.3)]`} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Dice Game ───
function DiceGame({
  roundNo,
  timeLeft,
  maxTime,
  onSubmit,
  disabled,
}: {
  roundNo: number;
  timeLeft: number;
  maxTime: number;
  onSubmit: (action: string) => void;
  disabled: boolean;
}) {
  const [rolling, setRolling] = useState(false);
  const [rollingFace, setRollingFace] = useState(1);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    if (!rolling) return;
    const interval = setInterval(() => {
      setRollingFace(Math.floor(Math.random() * 6) + 1);
    }, 80);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setRolling(false);
      if (chosen) onSubmit(chosen);
    }, 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [rolling, chosen, onSubmit]);

  function handleChoice(choice: string) {
    if (disabled || rolling || chosen) return;
    setChosen(choice);
    setRolling(true);
  }

  return (
    <div className="space-y-4">
      <TimeBar timeLeft={timeLeft} maxTime={maxTime} />
      <div className="text-center">
        <p className="text-base font-bold text-white">第 {roundNo} 回合 — 擲骰子比大小</p>
        <p className="mt-1 text-sm text-white/50">選擇你的預測，然後擲骰子！</p>
      </div>

      {/* Dice preview */}
      <div className="flex justify-center">
        <div className={rolling ? "animate-dice-roll" : ""} style={{ perspective: "400px" }}>
          <DiceFace value={rolling ? rollingFace : 0} color="white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleChoice("high")}
          disabled={disabled || rolling || chosen !== null}
          className={`rounded-2xl border p-6 text-center transition-all duration-200 disabled:opacity-50 ${
            chosen === "high"
              ? "border-emerald-400/50 bg-emerald-500/20 scale-[1.02] shadow-[0_0_24px_rgba(16,185,129,0.2)]"
              : "border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:scale-[1.02]"
          }`}
        >
          <span className="text-4xl">📈</span>
          <p className="mt-2 text-lg font-bold text-emerald-200">我押大</p>
          <p className="mt-1 text-xs text-white/40">我的骰子比對手大</p>
        </button>
        <button
          type="button"
          onClick={() => handleChoice("low")}
          disabled={disabled || rolling || chosen !== null}
          className={`rounded-2xl border p-6 text-center transition-all duration-200 disabled:opacity-50 ${
            chosen === "low"
              ? "border-sky-400/50 bg-sky-500/20 scale-[1.02] shadow-[0_0_24px_rgba(14,165,233,0.2)]"
              : "border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 hover:scale-[1.02]"
          }`}
        >
          <span className="text-4xl">📉</span>
          <p className="mt-2 text-lg font-bold text-sky-200">我押小</p>
          <p className="mt-1 text-xs text-white/40">我的骰子比對手小</p>
        </button>
      </div>
      {rolling && (
        <p className="text-center text-sm font-bold text-amber-300 animate-pulse">🎲 骰子翻滾中...</p>
      )}
    </div>
  );
}

// ─── Trivia Game ───
function TriviaGame({
  question,
  roundNo,
  timeLeft,
  maxTime,
  onSubmit,
  disabled,
}: {
  question: TriviaQuestion;
  roundNo: number;
  timeLeft: number;
  maxTime: number;
  onSubmit: (answerIndex: number) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  function handleSelect(idx: number) {
    if (disabled || selected !== null) return;
    setSelected(idx);
    setShowAnswer(true);
    // Brief delay to show correct/wrong before submitting
    setTimeout(() => onSubmit(idx), 800);
  }

  return (
    <div className="space-y-4 animate-slide-up-fade">
      <TimeBar timeLeft={timeLeft} maxTime={maxTime} />
      <div>
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>第 {roundNo} 題</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5">{question.category}</span>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-relaxed text-white">{question.question}</h3>
      </div>
      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.correctIndex;
          const revealed = showAnswer && selected !== null;

          let borderClass = "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5 hover:scale-[1.01]";
          if (revealed && isCorrect) {
            borderClass = "border-emerald-400/50 bg-emerald-500/15 scale-[1.01]";
          } else if (revealed && isSelected && !isCorrect) {
            borderClass = "border-rose-400/50 bg-rose-500/15 animate-hit-shake";
          } else if (isSelected && !revealed) {
            borderClass = "border-amber-400/50 bg-amber-500/15";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={disabled || selected !== null}
              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${borderClass} disabled:cursor-default`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    revealed && isCorrect
                      ? "bg-emerald-500 text-white"
                      : revealed && isSelected && !isCorrect
                        ? "bg-rose-500 text-white"
                        : isSelected
                          ? "bg-amber-500 text-black"
                          : "bg-white/10 text-white/50"
                  }`}
                >
                  {revealed && isCorrect ? "✓" : revealed && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm text-white/80">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Slot Machine Game ───
function SlotTile({ symbol, spinning = false, justStopped = false }: { symbol: string; spinning?: boolean; justStopped?: boolean }) {
  const meta = SLOT_FACE_META[symbol as SlotSymbol];
  if (!meta) {
    return (
      <div className={`flex h-20 items-center justify-center rounded-xl border border-white/20 bg-black/30 text-2xl font-black text-white ${spinning ? "animate-reel-spin" : ""}`}>
        {symbol}
      </div>
    );
  }
  return (
    <div className={`flex h-20 flex-col items-center justify-center rounded-xl border border-white/20 bg-gradient-to-b ${meta.tone} shadow-inner transition-all ${
      spinning ? "animate-reel-spin opacity-80" : justStopped ? "animate-reel-stop" : ""
    }`}>
      <p className="text-2xl font-black text-white drop-shadow">{meta.glyph}</p>
      <p className="mt-0.5 text-[9px] font-semibold tracking-widest text-white/70">{meta.label}</p>
    </div>
  );
}

function SlotsGame({
  roundNo,
  timeLeft,
  maxTime,
  onSubmit,
  disabled,
}: {
  roundNo: number;
  timeLeft: number;
  maxTime: number;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const [phase, setPhase] = useState<"ready" | "spinning" | "stopping" | "done">("ready");
  const [reels, setReels] = useState<string[]>(["?", "?", "?"]);
  const [stopped, setStopped] = useState(0);
  const [justStoppedIdx, setJustStoppedIdx] = useState(-1);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTriple = phase === "done" && reels[0] === reels[1] && reels[1] === reels[2] && reels[0] !== "?";

  function handleSpin() {
    if (phase !== "ready") return;
    setPhase("spinning");
    setStopped(0);
    setJustStoppedIdx(-1);

    spinTimerRef.current = setInterval(() => {
      setReels([
        SLOT_FACES[Math.floor(Math.random() * SLOT_FACES.length)],
        SLOT_FACES[Math.floor(Math.random() * SLOT_FACES.length)],
        SLOT_FACES[Math.floor(Math.random() * SLOT_FACES.length)],
      ]);
    }, 80);

    setTimeout(() => {
      setPhase("stopping");
      setStopped(1);
      setJustStoppedIdx(0);
      setTimeout(() => setJustStoppedIdx(-1), 400);
    }, 1200);

    setTimeout(() => {
      setStopped(2);
      setJustStoppedIdx(1);
      setTimeout(() => setJustStoppedIdx(-1), 400);
    }, 2400);

    setTimeout(() => {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current);
      setStopped(3);
      setJustStoppedIdx(2);
      setTimeout(() => setJustStoppedIdx(-1), 400);
      setPhase("done");
    }, 3800);
  }

  useEffect(() => {
    if (phase !== "stopping") return;
    const flicker = setInterval(() => {
      setReels((prev) => prev.map((r, i) =>
        i < stopped ? r : SLOT_FACES[Math.floor(Math.random() * SLOT_FACES.length)]
      ));
    }, 80);
    return () => clearInterval(flicker);
  }, [phase, stopped]);

  return (
    <div className="space-y-4">
      <TimeBar timeLeft={timeLeft} maxTime={maxTime} />
      <div className="text-center">
        <p className="text-base font-bold text-white">第 {roundNo} 回合 — 拉霸機</p>
        <p className="mt-1 text-sm text-white/50">拉下拉桿，三格連線為勝！</p>
      </div>

      {/* FRLG-style slot machine */}
      <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-b from-[#5a2f16] to-[#3c1f12] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Decorative top lights */}
        <div className="mb-2 flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 w-2 rounded-full ${
              phase === "spinning" || phase === "stopping"
                ? "bg-amber-400 animate-pulse"
                : isTriple
                  ? "bg-emerald-400 animate-slot-flash"
                  : "bg-amber-900/50"
            }`} style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>

        <div className={`rounded-xl border bg-[#18361d] p-4 shadow-inner transition-all duration-300 ${
          isTriple ? "border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "border-amber-200/20"
        }`}>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-amber-100/70">
            <span>GAME CORNER</span>
            <span>3 REEL</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {reels.map((face, idx) => (
              <SlotTile
                key={`slot-${idx}`}
                symbol={face}
                spinning={idx >= stopped && phase !== "ready"}
                justStopped={justStoppedIdx === idx}
              />
            ))}
          </div>
          {isTriple && (
            <p className="mt-2 text-center text-sm font-black text-emerald-300 animate-glow-pulse">🎉 三格連線！</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={phase !== "ready"}
          className={`mt-3 w-full rounded-xl border border-amber-200/30 bg-gradient-to-b from-amber-400/30 to-orange-500/20 px-4 py-3 text-sm font-black text-amber-100 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
            phase === "ready" ? "hover:scale-[1.02] active:scale-[0.98]" : ""
          }`}
        >
          {phase === "ready" ? "🎰 拉下拉桿" : phase === "done" ? "✅ 已完成" : "🎰 轉動中..."}
        </button>
      </div>

      {phase === "done" && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-base font-bold text-white transition-all hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          確認結果
        </button>
      )}
    </div>
  );
}

// ─── Confetti Particle ───
const CONFETTI_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];

function ConfettiParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: `${5 + Math.random() * 90}%`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti-fall ${1.5 + Math.random() * 1.5}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Round Result Overlay ───
function RoundResultOverlay({
  result,
  onContinue,
}: {
  result: RoundResultData;
  onContinue: () => void;
}) {
  const isWin = result.roundResult === "win";
  const payload = result.roundPayload;
  const isSlots = Array.isArray(payload?.playerReels);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${!isWin ? "animate-hit-shake" : ""}`}>
      <div className="relative mx-4 max-w-sm animate-pop-in rounded-3xl border border-white/15 bg-[linear-gradient(160deg,#1a1530,#0d1a2a)] p-8 text-center shadow-2xl">
        {isWin && <ConfettiParticles />}

        <div className={`relative text-5xl ${isWin ? "animate-bounce" : ""}`}>
          {isWin ? "🎉" : "😤"}
        </div>
        <h2 className={`mt-4 text-2xl font-black ${isWin ? "text-emerald-300 animate-glow-pulse" : "text-rose-300"}`}>
          {isWin ? "本回合勝利！" : "本回合落敗"}
        </h2>

        {/* Dice result with visual dice */}
        {typeof payload?.playerDice === "number" ? (
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] text-blue-300/60">你</p>
              <div className="animate-dice-reveal">
                <DiceFace value={Number(payload.playerDice)} color="blue" size="sm" />
              </div>
            </div>
            <span className="text-lg font-black text-white/30">vs</span>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] text-rose-300/60">對手</p>
              <div className="animate-dice-reveal" style={{ animationDelay: "0.3s", opacity: 0 }}>
                <DiceFace value={Number(payload.opponentDice)} color="red" size="sm" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Trivia result */}
        {Boolean(payload?.question) ? (
          <div className="mt-4 space-y-1.5 text-left">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
              Boolean(payload.playerCorrect) ? "bg-emerald-500/10" : "bg-rose-500/10"
            }`}>
              <span className="text-sm">{Boolean(payload.playerCorrect) ? "✅" : "❌"}</span>
              <p className="text-xs text-white/60">
                {Boolean(payload.playerCorrect) ? "你答對了！" : "你答錯了"}
              </p>
            </div>
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
              Boolean(payload.opponentCorrect) ? "bg-emerald-500/10" : "bg-rose-500/10"
            }`}>
              <span className="text-sm">{Boolean(payload.opponentCorrect) ? "✅" : "❌"}</span>
              <p className="text-xs text-white/60">
                {Boolean(payload.opponentCorrect) ? "對手答對了" : "對手答錯了"}
              </p>
            </div>
          </div>
        ) : null}

        {/* Slot result */}
        {isSlots ? (
          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-1 text-xs font-bold text-blue-300">🎰 你的拉霸</p>
              <div className="grid grid-cols-3 gap-2">
                {(payload.playerReels as string[]).map((s, i) => (
                  <SlotTile key={`p-${i}`} symbol={s} />
                ))}
              </div>
            </div>
            {Array.isArray(payload.opponentReels) && (
              <div>
                <p className="mb-1 text-xs font-bold text-rose-300">🎰 對手的拉霸</p>
                <div className="grid grid-cols-3 gap-2">
                  {(payload.opponentReels as string[]).map((s, i) => (
                    <SlotTile key={`o-${i}`} symbol={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-5 flex justify-center gap-4 text-sm">
          <span className="text-emerald-300 font-bold">{result.playerScore} 勝</span>
          <span className="text-white/30">—</span>
          <span className="text-rose-300 font-bold">{result.opponentScore} 勝</span>
        </div>

        {result.partnerJustUnlocked && (
          <div className="mt-4 animate-pop-in rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
            <p className="text-sm font-bold text-emerald-300">🎉 伴侶寶可夢已永久解鎖！</p>
          </div>
        )}

        {result.secondPokemonJustUnlocked && (
          <div className="mt-3 animate-pop-in rounded-xl border border-purple-400/30 bg-purple-500/10 p-3" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm font-bold text-purple-300">🌟 第二隻寶可夢相遇權已解鎖！</p>
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-base font-bold text-white transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
        >
          {result.battleFinished ? "查看最終結果" : "下一回合"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Battle Console ───
export function Anniversary30thBattleConsole({
  partnerPokemon,
  partnerSpriteUrl,
  playerDisplayName,
  battlesRemaining,
  totalWins,
  winStreak,
  initialBattle,
}: BattleConsoleProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initialBattle ? "playing" : "idle");
  const [battle, setBattle] = useState<AnniversaryBattle | null>(initialBattle);
  const [currentRound, setCurrentRound] = useState(initialBattle?.current_round ?? 0);
  const [playerScore, setPlayerScore] = useState(initialBattle?.player_score ?? 0);
  const [opponentScore, setOpponentScore] = useState(initialBattle?.opponent_score ?? 0);
  const [challengeType, setChallengeType] = useState<ChallengeType>((initialBattle?.challenge_type as ChallengeType) || "dice");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [battleResult, setBattleResult] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const meta = CHALLENGE_META[challengeType];
  const [timeLeft, setTimeLeft] = useState(meta.timeLimit);

  function resetBattleState(nextPhase: Phase = "idle") {
    setBattle(null);
    setRoundResult(null);
    setBattleResult(null);
    setCurrentRound(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setTriviaQuestions([]);
    setPhase(nextPhase);
  }

  async function refreshBattleActivity(nextPhase?: Phase) {
    if (!battle) return false;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/anniversary-30th/battle/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId: battle.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.battleExpired) {
          resetBattleState("idle");
          setError(data.error || "這場對決已逾時，已自動結束。");
          router.refresh();
          return false;
        }
        throw new Error(data.error || "無法更新對戰狀態");
      }

      setBattle((prev) => prev ? {
        ...prev,
        last_active_at: data.lastActiveAt || prev.last_active_at,
      } : prev);

      if (nextPhase) {
        setPhase(nextPhase);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法更新對戰狀態");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!battle || challengeType !== "trivia") return;
    setTriviaQuestions(pickTriviaQuestions(`${battle.id}:trivia`, 10));
  }, [battle, challengeType]);

  useEffect(() => {
    if (!initialBattle) return;
    void refreshBattleActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBattle?.id]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;

    setTimeLeft(meta.timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up - auto submit
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentRound]);

  const handleAutoSubmit = useCallback(() => {
    if (challengeType === "dice") {
      submitRound("auto");
    } else if (challengeType === "trivia") {
      submitRound(-1);
    } else {
      submitRound("auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeType, battle, currentRound]);

  // Matchmaking complete
  const handleMatchmakingComplete = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/anniversary-30th/battle/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "無法建立對決");

      setBattle(data.battle);
      setChallengeType(data.battle.challenge_type || "dice");
      setCurrentRound(data.battle.current_round || 0);
      setPlayerScore(0);
      setOpponentScore(0);

      // Load trivia questions if needed
      if (data.battle.challenge_type === "trivia") {
        const questions = pickTriviaQuestions(`${data.battle.id}:trivia`, 10);
        setTriviaQuestions(questions);
      }

      setPhase("rules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "配對失敗");
      setPhase("idle");
    }
  }, []);

  // Submit round
  async function submitRound(action: unknown) {
    if (!battle || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setError("");

    const nextRound = currentRound + 1;

    try {
      const bodyPayload: Record<string, unknown> = {
        battleId: battle.id,
        roundNo: nextRound,
        action: String(action),
      };

      // For trivia, send selected answer
      if (challengeType === "trivia") {
        bodyPayload.selectedAnswer = typeof action === "number" ? action : -1;
      }

      const res = await fetch("/api/anniversary-30th/battle/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.battleExpired) {
          resetBattleState("idle");
          setError(data.error || "這場對決已逾時，已自動結束。");
          router.refresh();
          return;
        }
        throw new Error(data.error || "結算失敗");
      }

      setCurrentRound(nextRound);
      setPlayerScore(data.playerScore);
      setOpponentScore(data.opponentScore);
      setBattle((prev) => prev ? {
        ...prev,
        current_round: nextRound,
        player_score: data.playerScore,
        opponent_score: data.opponentScore,
        status: data.battleFinished ? (data.battleResult || prev.status) : "in_progress",
        last_active_at: data.lastActiveAt || prev.last_active_at,
      } : prev);

      // Attack animation
      setIsAttacking(true);
      setTimeout(() => setIsAttacking(false), 600);

      // Show round result
      setRoundResult(data as RoundResultData);
      setPhase("round-result");

      if (data.battleFinished) {
        setBattleResult(data.battleResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "結算失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoundResultContinue() {
    if (battle && isBattleSessionExpired(battle.last_active_at || battle.started_at)) {
      resetBattleState("idle");
      setError("這場對決已逾時，已自動結束。");
      router.refresh();
      return;
    }

    if (roundResult?.battleFinished) {
      setPhase("finished");
    } else {
      const canContinue = await refreshBattleActivity("playing");
      if (canContinue) {
        setRoundResult(null);
      }
    }
  }

  // ─── Render ───
  return (
    <div className="space-y-6">
      {/* Matchmaking Overlay */}
      {phase === "matchmaking" && (
        <MatchmakingOverlay onComplete={handleMatchmakingComplete} />
      )}

      {/* Rules Popup */}
      {phase === "rules" && (
        <RulesPopup
          challengeType={challengeType}
          onStart={() => {
            void refreshBattleActivity("playing");
          }}
        />
      )}

      {/* Round Result Overlay */}
      {phase === "round-result" && roundResult && (
        <RoundResultOverlay
          result={roundResult}
          onContinue={() => {
            void handleRoundResultContinue();
          }}
        />
      )}

      {/* Main Content */}
      <section className="relative overflow-hidden rounded-[32px] border border-amber-300/20 bg-[radial-gradient(circle_at_10%_8%,rgba(251,191,36,0.15),transparent_30%),radial-gradient(circle_at_90%_92%,rgba(239,68,68,0.15),transparent_30%),linear-gradient(160deg,#0d111f,#171126_44%,#0f2330)] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.55)] md:p-7">
        <div className="pointer-events-none absolute -left-14 top-4 h-40 w-40 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-4 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative space-y-5">
          {/* VS Header (when battle is active) */}
          {battle && phase !== "idle" && phase !== "finished" && (
            <VSHeader
              playerSprite={partnerSpriteUrl}
              playerName={`${playerDisplayName}的${partnerPokemon.name}`}
              opponentSprite={getPokemonSpriteUrl(battle.opponent_sprite_id)}
              opponentName={`${battle.opponent_name}的${battle.opponent_pokemon}`}
              playerScore={playerScore}
              opponentScore={opponentScore}
              isAttacking={isAttacking}
            />
          )}

          {/* Idle State */}
          {phase === "idle" && (
            <div className="py-8 text-center">
              <img
                src={partnerSpriteUrl}
                alt={partnerPokemon.name}
                className="mx-auto h-32 w-32 object-contain drop-shadow-[0_6px_24px_rgba(251,191,36,0.3)]"
              />
              <h2 className="mt-5 text-2xl font-black text-white">準備好了嗎？</h2>
              <p className="mt-2 text-sm text-white/55">
                {battlesRemaining > 0
                  ? `今日還有 ${battlesRemaining} 場對決。點擊下方按鈕開始配對！`
                  : "今日場次已用完，明天再來吧！"}
              </p>

              <div className="mt-4 flex justify-center gap-4 text-sm text-white/50">
                <span>總勝場 {totalWins}</span>
                <span>•</span>
                <span>連勝 {winStreak}</span>
              </div>

              {battlesRemaining > 0 ? (
                <button
                  type="button"
                  onClick={() => setPhase("matchmaking")}
                  className="mt-8 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-4 text-lg font-bold text-white shadow-[0_8px_32px_rgba(251,191,36,0.25)] transition hover:brightness-110"
                >
                  ⚔️ 開始配對對手
                </button>
              ) : (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/50">
                  今日已完成
                </div>
              )}
            </div>
          )}

          {/* Playing State */}
          {phase === "playing" && battle && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-white/40">
                <span>回合 {currentRound + 1} / {meta.totalRounds}</span>
                <span>{meta.label}</span>
              </div>

              {challengeType === "dice" && (
                <DiceGame
                  roundNo={currentRound + 1}
                  timeLeft={timeLeft}
                  maxTime={meta.timeLimit}
                  onSubmit={(action) => submitRound(action)}
                  disabled={submitting}
                />
              )}

              {challengeType === "trivia" && triviaQuestions[currentRound] && (
                <TriviaGame
                  question={triviaQuestions[currentRound]}
                  roundNo={currentRound + 1}
                  timeLeft={timeLeft}
                  maxTime={meta.timeLimit}
                  onSubmit={(idx) => submitRound(idx)}
                  disabled={submitting}
                />
              )}

              {challengeType === "slots" && (
                <SlotsGame
                  roundNo={currentRound + 1}
                  timeLeft={timeLeft}
                  maxTime={meta.timeLimit}
                  onSubmit={() => submitRound("spin")}
                  disabled={submitting}
                />
              )}
            </div>
          )}

          {/* Finished State */}
          {phase === "finished" && (
            <div className="py-8 text-center">
              <div className="text-5xl">{battleResult === "won" ? "🏆" : "💪"}</div>
              <h2 className={`mt-4 text-3xl font-black ${battleResult === "won" ? "text-amber-300" : "text-white"}`}>
                {battleResult === "won" ? "對決勝利！" : "對決結束"}
              </h2>
              <div className="mt-4 flex justify-center gap-6">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2">
                  <p className="text-2xl font-black text-emerald-300">{playerScore}</p>
                  <p className="text-[10px] text-white/40">你的得分</p>
                </div>
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2">
                  <p className="text-2xl font-black text-rose-300">{opponentScore}</p>
                  <p className="text-[10px] text-white/40">對手得分</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {battlesRemaining > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      resetBattleState("idle");
                      router.refresh();
                    }}
                    className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white transition hover:brightness-110"
                  >
                    再來一場
                  </button>
                )}
                <Link
                  href="/anniversary-30th"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-center font-semibold text-white/80 transition hover:bg-white/10"
                >
                  返回活動中心
                </Link>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-3 text-center text-sm text-rose-300">{error}</p>
          )}
        </div>
      </section>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href="/anniversary-30th"
          className="text-sm text-white/40 underline underline-offset-4 transition hover:text-white/60"
        >
          ← 返回活動中心
        </Link>
      </div>
    </div>
  );
}
