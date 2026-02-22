"use client";

import { useState } from "react";
import { Zap, PackageOpen, CheckCircle, Skull, ArrowRight } from "lucide-react";

type BoxContent = 'empty' | 'multiplier' | 'bomb';
type GameState = 'idle' | 'playing' | 'busted' | 'cashed_out';

interface RiskBoxGameProps {
    user: { id: string; name: string } | null;
    userPoints: number;
    onPointsChange: () => void;
}

export default function RiskBoxGame({ user, userPoints, onPointsChange }: RiskBoxGameProps) {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [betAmount, setBetAmount] = useState<number>(100);
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [accumulatedWinnings, setAccumulatedWinnings] = useState<number>(0);
    const [boxes, setBoxes] = useState<{ id: number; isOpen: boolean; content: BoxContent }[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 每一關的賠率與配置 (以 3 個箱子為基準)
    // 預設配置：2個安全(1.2x ~ 1.5x)，1個炸彈
    const generateLevelBoxes = () => {
        const contents: BoxContent[] = ['multiplier', 'multiplier', 'bomb'];
        // 隨機打亂
        for (let i = contents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [contents[i], contents[j]] = [contents[j], contents[i]];
        }

        return [
            { id: 0, isOpen: false, content: contents[0] },
            { id: 1, isOpen: false, content: contents[1] },
            { id: 2, isOpen: false, content: contents[2] },
        ];
    };

    const startGame = async () => {
        if (!user) return setErrorMsg('請先登入才能遊玩！');
        if (betAmount < 10) return setErrorMsg('最低下注 10 點');
        if (betAmount > userPoints) return setErrorMsg('點數不足！');

        setErrorMsg('');
        setIsProcessing(true);

        try {
            // 呼叫 API 扣款
            const res = await fetch('/api/games/crash', { // 暫時共用同一個交易 API 或是之後建獨立的
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bet', betAmount })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '下注失敗');
            }

            onPointsChange();

            setGameState('playing');
            setCurrentLevel(1);
            setAccumulatedWinnings(betAmount); // 初始獎金為本金
            setBoxes(generateLevelBoxes());

        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrorMsg(error.message);
            } else {
                setErrorMsg('發生未知錯誤');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenBox = async (index: number) => {
        if (gameState !== 'playing' || boxes[index].isOpen || isProcessing) return;

        const newBoxes = [...boxes];
        const selectedBox = newBoxes[index];
        selectedBox.isOpen = true;
        setBoxes(newBoxes);

        if (selectedBox.content === 'bomb') {
            // 爆炸：獎金歸零
            setGameState('busted');

            // 自動翻開其他箱子展示
            setTimeout(() => {
                setBoxes(prev => prev.map(b => ({ ...b, isOpen: true })));
            }, 800);

        } else {
            // 安全：獎金結算
            // 這裡簡單設計：第一關贏了變 1.4x, 第二關變 2.0x, 第三關變 3.0x...
            const multiplier = 1 + (currentLevel * 0.4);
            const newWinnings = Math.floor(betAmount * multiplier);
            setAccumulatedWinnings(newWinnings);

            // 等待玩家決定繼續還是提款
        }
    };

    const handleNextLevel = () => {
        if (gameState !== 'playing') return;
        setCurrentLevel(prev => prev + 1);
        setBoxes(generateLevelBoxes());
    };

    const handleCashOut = async () => {
        if (gameState !== 'playing' || accumulatedWinnings <= betAmount) return; // 沒中過獎不能提款

        setIsProcessing(true);
        try {
            await fetch('/api/games/crash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cashout', betAmount, winAmount: accumulatedWinnings })
            });

            setGameState('cashed_out');
            onPointsChange();

            // 展示所有箱子
            setBoxes(prev => prev.map(b => ({ ...b, isOpen: true })));

        } catch (err) {
            console.error('結算失敗', err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 左側：控制面板 */}
                <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 font-medium">可用點數</span>
                        <span className="text-yellow-300 font-bold">
                            {userPoints.toLocaleString()} 點
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">入場費 (下注金額)</label>
                        <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                disabled={gameState === 'playing'}
                                className="w-full bg-transparent px-4 py-3 text-white outline-none"
                                min={10}
                                max={userPoints}
                            />
                        </div>
                        {errorMsg && <p className="text-red-400 text-xs mt-1">{errorMsg}</p>}
                    </div>

                    <div className="mt-auto pt-4 space-y-3">
                        {gameState === 'idle' || gameState === 'busted' || gameState === 'cashed_out' ? (
                            <button
                                onClick={startGame}
                                disabled={!user || userPoints < 10 || isProcessing}
                                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/25 disabled:opacity-50"
                            >
                                {gameState === 'idle' ? '開始探險' : '重新開始'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCashOut}
                                    disabled={accumulatedWinnings <= betAmount || isProcessing}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${accumulatedWinnings > betAmount
                                        ? 'text-black bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50 hover:brightness-110'
                                        : 'text-white/40 bg-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    見好就收拿走 ({accumulatedWinnings.toLocaleString()})
                                </button>

                                {accumulatedWinnings > betAmount && boxes.some(b => b.isOpen) && !boxes.some(b => b.isOpen && b.content === 'bomb') && (
                                    <button
                                        onClick={handleNextLevel}
                                        disabled={isProcessing}
                                        className="w-full py-3 flex justify-center items-center gap-2 rounded-xl border border-yellow-500/50 text-yellow-500 font-semibold hover:bg-yellow-500/10 transition-colors"
                                    >
                                        進入第 {currentLevel + 1} 關 <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* 右側：遊戲主畫面 */}
                <div className="md:col-span-2 glass-card p-6 flex flex-col items-center min-h-[400px]">

                    <div className="flex justify-between items-center w-full mb-8">
                        <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/70 font-semibold text-sm">
                            第 {currentLevel} 關
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-white/50 mb-1">目前累積獎金</div>
                            <div className={`text-3xl font-bold transition-colors ${gameState === 'busted' ? 'text-red-500' : 'text-yellow-400'}`}>
                                {gameState === 'busted' ? 0 : accumulatedWinnings.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {gameState === 'idle' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/40 max-w-sm text-center">
                            <Zap className="w-16 h-16 mb-4 opacity-50" />
                            <p>點擊左側「開始探險」<br />每一關從三個箱子裡避開雷電球，尋找獎勵倍率！</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center w-full">
                            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto w-full">
                                {boxes.map((box, idx) => (
                                    <button
                                        key={box.id}
                                        onClick={() => handleOpenBox(idx)}
                                        disabled={box.isOpen || gameState !== 'playing' || (boxes.some(b => b.isOpen))} // 一關只能開一個
                                        className={`
                                            relative aspect-square rounded-2xl border-2 transition-all duration-300 transform
                                            ${!box.isOpen && gameState === 'playing' ? 'border-yellow-500/40 hover:border-yellow-400 hover:-translate-y-2 hover:shadow-xl hover:shadow-yellow-500/20 bg-gradient-to-b from-white/5 to-white/10 cursor-pointer' : ''}
                                            ${box.isOpen ? 'scale-95' : ''}
                                            ${box.isOpen && box.content === 'bomb' ? 'border-red-500 bg-red-500/20' : ''}
                                            ${box.isOpen && box.content === 'multiplier' ? 'border-green-500 bg-green-500/20' : ''}
                                            ${!box.isOpen && gameState !== 'playing' ? 'border-white/10 opacity-50 bg-white/5' : ''}
                                        `}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {!box.isOpen ? (
                                                <PackageOpen className="w-1/3 h-1/3 text-yellow-500/50" />
                                            ) : box.content === 'bomb' ? (
                                                <div className="text-center animate-bounce">
                                                    <Skull className="w-12 h-12 text-red-400 mx-auto" />
                                                </div>
                                            ) : (
                                                <div className="text-center animate-pulse">
                                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                                    <span className="font-bold text-green-300">安全</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* 狀態提示 */}
                            <div className="mt-12 text-center h-16">
                                {gameState === 'busted' && (
                                    <div className="text-red-400 font-bold text-xl animate-pulse">
                                        💥 炸彈！累積獎金歸零了...
                                    </div>
                                )}
                                {gameState === 'cashed_out' && (
                                    <div className="text-green-400 font-bold text-xl">
                                        💰 恭喜！成功帶走 {accumulatedWinnings.toLocaleString()} 點金幣！
                                    </div>
                                )}
                                {gameState === 'playing' && boxes.some(b => b.isOpen) && !boxes.some(b => b.isOpen && b.content === 'bomb') && (
                                    <div className="text-yellow-300 font-semibold animate-pulse">
                                        太好了！要帶走獎金，還是挑戰下一關？
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
