"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

type GameState = 'idle' | 'betting' | 'playing' | 'crashed' | 'cashed_out';

interface CrashGameProps {
    user: { id: string; name: string } | null;
    userPoints: number;
    onPointsChange: () => void; // Trigger parent to refresh points
}

export default function CrashGame({ user, userPoints, onPointsChange }: CrashGameProps) {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [betAmount, setBetAmount] = useState<number>(100);
    const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
    const [earnedAmount, setEarnedAmount] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState('');

    // 遊戲循環引用
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>(0);

    // 取得崩潰點 (實際應用應由後端決定，此處先以安全的前端邏輯實作雛形)
    // 多巴胺機制：高機率在 1x ~ 2x 爆，但有時候會衝到 10x 甚至 50x
    const generateCrashPoint = () => {
        const e = 2 ** 32;
        const h = crypto.getRandomValues(new Uint32Array(1))[0];
        // 基本的 Crash 機制數學模型：(100 - 邊緣優勢) / (隨機數)
        // 這裡設定 5% 的莊家優勢，代表有 5% 機率直接 1.00x 爆炸
        if (h % 33 === 0) return 1.00;

        const crash = Math.max(1.00, (100 * e - h) / (e - h)) / 100;
        return parseFloat(crash.toFixed(2));
    };

    const startGame = async () => {
        if (!user) return setErrorMsg('請先登入才能遊玩！');
        if (betAmount < 10) return setErrorMsg('最低下注 10 點');
        if (betAmount > userPoints) return setErrorMsg('點數不足！');

        setErrorMsg('');
        setGameState('betting');

        try {
            // 1. 呼叫 API 預扣點數 
            const res = await fetch('/api/games/crash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bet', betAmount })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '下注失敗');
            }

            // 下注成功，重新同步父層顯示的點數
            onPointsChange();

            // 2. 決定爆點
            const targetCrash = generateCrashPoint();

            // 3. 倒數 3 秒後開始飛
            setTimeout(() => {
                setGameState('playing');
                startTimeRef.current = performance.now();
                runGameLoop(targetCrash);
            }, 3000);

        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrorMsg(error.message);
            } else {
                setErrorMsg('發生未知錯誤');
            }
            setGameState('idle');
        }
    };

    const runGameLoop = (target: number) => {
        const update = (timestamp: number) => {
            const elapsed = timestamp - startTimeRef.current;
            // 指數上升公式：e^(kt)，讓它越跑越快
            // elapsed 是毫秒，我們讓它每 10 秒大約達到 10x
            const timeInSeconds = elapsed / 1000;
            const newMultiplier = Math.pow(Math.E, 0.23 * timeInSeconds);

            if (newMultiplier >= target) {
                // 爆炸了！
                setCurrentMultiplier(target);
                setGameState('crashed');
            } else {
                setCurrentMultiplier(newMultiplier);
                if (gameState === 'playing') {
                    animationRef.current = requestAnimationFrame(update);
                }
            }
        };
        animationRef.current = requestAnimationFrame(update);
    };

    const handleCashOut = async () => {
        if (gameState !== 'playing') return;

        // 停止循環
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const winAmount = Math.floor(betAmount * currentMultiplier);
        setEarnedAmount(winAmount);
        setGameState('cashed_out');

        try {
            // 呼叫 API 將 winAmount 加回玩家錢包
            await fetch('/api/games/crash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cashout', betAmount, winAmount })
            });
            onPointsChange();
        } catch (err) {
            console.error('結算失敗', err);
        }
    };

    // 清理動畫
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="max-w-4xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 左側：控制面板 */}
                <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 font-medium">可用點數</span>
                        <span className="text-yellow-300 font-bold flex items-center gap-1">
                            {userPoints.toLocaleString()} 點
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">下注金額</label>
                        <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                disabled={gameState === 'playing' || gameState === 'betting'}
                                className="w-full bg-transparent px-4 py-3 text-white outline-none"
                                min={10}
                                max={userPoints}
                            />
                            <button
                                onClick={() => setBetAmount(Math.floor(userPoints / 2))}
                                disabled={gameState === 'playing' || gameState === 'betting'}
                                className="px-3 text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
                            >
                                1/2
                            </button>
                            <button
                                onClick={() => setBetAmount(userPoints)}
                                disabled={gameState === 'playing' || gameState === 'betting'}
                                className="px-3 text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
                            >
                                MAX
                            </button>
                        </div>
                        {errorMsg && <p className="text-red-400 text-xs mt-1">{errorMsg}</p>}
                    </div>

                    <div className="mt-auto pt-4">
                        {gameState === 'idle' || gameState === 'crashed' || gameState === 'cashed_out' ? (
                            <button
                                onClick={startGame}
                                disabled={!user || userPoints < 10}
                                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                開始下注
                            </button>
                        ) : gameState === 'betting' ? (
                            <button
                                disabled
                                className="w-full py-4 rounded-xl font-bold text-lg text-white/50 bg-white/10 cursor-not-allowed"
                            >
                                準備起飛...
                            </button>
                        ) : (
                            <button
                                onClick={handleCashOut}
                                className="w-full py-4 rounded-xl font-bold text-xl text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-500/50 animate-pulse"
                            >
                                跳傘結算 ({(betAmount * currentMultiplier).toFixed(0)})
                            </button>
                        )}
                    </div>
                </div>

                {/* 右側：遊戲主畫面 */}
                <div className="md:col-span-2 glass-card p-0 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center bg-zinc-900/50">

                    {/* 背景網格與裝飾 */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    {/* 主數字顯示 */}
                    <div className="relative z-10 text-center flex flex-col items-center">
                        {gameState === 'idle' ? (
                            <div className="text-4xl font-bold text-white/20 mb-4">等待下注</div>
                        ) : gameState === 'betting' ? (
                            <div className="text-5xl font-bold text-yellow-500 animate-pulse">準備中</div>
                        ) : (
                            <>
                                <div className={`text-7xl md:text-9xl font-black tabular-nums transition-colors duration-200 ${gameState === 'crashed' ? 'text-red-500' :
                                    gameState === 'cashed_out' ? 'text-green-500' : 'text-white'
                                    }`}>
                                    {currentMultiplier.toFixed(2)}x
                                </div>

                                {gameState === 'crashed' && (
                                    <div className="mt-4 flex items-center gap-2 text-2xl font-bold text-red-500 bg-red-500/10 px-6 py-2 rounded-full backdrop-blur-sm border border-red-500/20">
                                        <AlertTriangle /> 已經爆炸！
                                    </div>
                                )}

                                {gameState === 'cashed_out' && (
                                    <div className="mt-4 flex flex-col items-center text-green-400 font-bold bg-green-500/10 px-8 py-3 rounded-2xl backdrop-blur-sm border border-green-500/20">
                                        <span className="text-lg">成功逃生！</span>
                                        <span className="text-3xl">+ {earnedAmount.toLocaleString()} 點</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* 曲線繪圖 (簡易裝飾版) */}
                    {gameState === 'playing' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden opacity-30 pointer-events-none">
                            <svg className="w-full h-full" preserveAspectRatio="none">
                                <path
                                    d={`M 0 100 Q 50 ${100 - (currentMultiplier * 5)} 100 ${100 - (currentMultiplier * 15)}`}
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
