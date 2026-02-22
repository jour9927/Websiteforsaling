"use client";

import { useState } from "react";
import { Ticket, Sparkles, RefreshCw, Trophy, Skull } from "lucide-react";

type RewardType = 'arceus' | 'mew' | 'pikachu' | 'magikarp' | 'empty';
type GameState = 'idle' | 'scratching' | 'won' | 'lost';

interface Cell {
    id: number;
    content: RewardType;
    isRevealed: boolean;
}

interface ScratchGameProps {
    user: { id: string; name: string } | null;
    userPoints: number;
    onPointsChange: () => void;
}

const REWARD_SYMBOLS: Record<RewardType, { icon: string, name: string, color: string, value: number }> = {
    arceus: { icon: "✨", name: "阿爾宙斯", color: "text-yellow-300", value: 10000 },
    mew: { icon: "🌸", name: "夢幻", color: "text-pink-400", value: 5000 },
    pikachu: { icon: "⚡", name: "皮卡丘", color: "text-yellow-500", value: 500 },
    magikarp: { icon: "🐟", name: "鯉魚王", color: "text-orange-400", value: 50 },
    empty: { icon: "💨", name: "銘謝惠顧", color: "text-slate-400", value: 0 }
};

export default function ScratchGame({ user, userPoints, onPointsChange }: ScratchGameProps) {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [betAmount, setBetAmount] = useState<number>(100);
    const [cells, setCells] = useState<Cell[]>(Array(9).fill({ id: 0, content: 'empty', isRevealed: false }));
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [winAmount, setWinAmount] = useState(0);

    // 多巴胺核心引擎：生成「近乎中獎」的作弊盤面
    const generateBoard = () => {
        // 設定機率：真的中大獎的機率極低，但出現「差一個就中獎(Near Miss)」的機率極高
        const rand = Math.random();

        let targetReward: RewardType = 'empty';
        let isWinningBoard = false;
        let nearMissReward: RewardType | null = null;

        if (rand < 0.05) {
            // 5% 中小獎 (皮卡丘或鯉魚王)
            targetReward = rand < 0.02 ? 'pikachu' : 'magikarp';
            isWinningBoard = true;
        } else if (rand < 0.06) {
            // 1% 中夢幻
            targetReward = 'mew';
            isWinningBoard = true;
        } else if (rand < 0.062) {
            // 0.2% 中阿爾宙斯
            targetReward = 'arceus';
            isWinningBoard = true;
        } else {
            // 沒中獎！但我們要製造大量的 Near Miss
            if (rand < 0.4) {
                // 34% 機率給你差點中阿爾宙斯
                nearMissReward = 'arceus';
            } else if (rand < 0.7) {
                // 30% 機率給你差點中夢幻
                nearMissReward = 'mew';
            } else {
                // 其他隨機敗局
                nearMissReward = 'magikarp';
            }
        }

        const board: RewardType[] = Array(9).fill('empty');
        const availableOptions: RewardType[] = ['pikachu', 'magikarp', 'empty', 'empty', 'empty'];

        if (isWinningBoard) {
            // 放 3 個一樣的進去
            let placed = 0;
            while (placed < 3) {
                const idx = Math.floor(Math.random() * 9);
                if (board[idx] === 'empty') {
                    board[idx] = targetReward;
                    placed++;
                }
            }
            // 填滿剩下的
            for (let i = 0; i < 9; i++) {
                if (board[i] === 'empty') {
                    board[i] = availableOptions[Math.floor(Math.random() * availableOptions.length)];
                }
            }
        } else {
            // 製造 Near Miss：放 2 個一樣的高級獎品
            if (nearMissReward) {
                let placed = 0;
                while (placed < 2) {
                    const idx = Math.floor(Math.random() * 9);
                    if (board[idx] === 'empty') {
                        board[idx] = nearMissReward;
                        placed++;
                    }
                }
            }
            // 填滿剩下的，確保沒有任何一個東西超過 2 個
            const counts: Record<string, number> = {};
            if (nearMissReward) counts[nearMissReward] = 2;

            for (let i = 0; i < 9; i++) {
                if (board[i] === 'empty') {
                    let fill: RewardType;
                    do {
                        fill = availableOptions[Math.floor(Math.random() * availableOptions.length)];
                    } while ((counts[fill] || 0) >= 2);

                    board[i] = fill;
                    counts[fill] = (counts[fill] || 0) + 1;
                }
            }
        }

        return board.map((content, i) => ({ id: i, content, isRevealed: false }));
    };

    const buyTicket = async () => {
        if (!user) return setMessage('請先登入才能遊玩！');
        if (betAmount < 10) return setMessage('最低面額 10 點');
        if (betAmount > userPoints) return setMessage('點數不足！');

        setMessage('');
        setIsProcessing(true);

        try {
            // 扣款
            const res = await fetch('/api/games/crash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bet', betAmount })
            });

            if (!res.ok) throw new Error('購買失敗');

            onPointsChange();

            setCells(generateBoard());
            setGameState('scratching');
            setWinAmount(0);

        } catch (error: unknown) {
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage('發生未知錯誤');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScratch = (index: number) => {
        if (gameState !== 'scratching' || cells[index].isRevealed) return;

        const newCells = [...cells];
        newCells[index].isRevealed = true;
        setCells(newCells);

        checkWinCondition(newCells);
    };

    const checkWinCondition = async (currentCells: Cell[]) => {
        const revealedCells = currentCells.filter(c => c.isRevealed);
        if (revealedCells.length === 9) {
            // 全部刮開了，計算有沒有 3 個一樣的 (僅限已刮開)
            const counts: Record<string, number> = {};
            let winningSymbol: RewardType | null = null;

            for (const cell of currentCells) {
                counts[cell.content] = (counts[cell.content] || 0) + 1;
                if (counts[cell.content] === 3) {
                    winningSymbol = cell.content;
                    break;
                }
            }

            if (winningSymbol) {
                // 中獎
                const multiplier = REWARD_SYMBOLS[winningSymbol].value / 100; // if base value is 10000, multiplier is 100x
                // 這裡的邏輯可以依照你要不要把下注金額乘上賠率，我們用簡單寫法：下注越多，按比例放大
                const finalWin = Math.floor(betAmount * multiplier);

                setWinAmount(finalWin);
                setGameState('won');

                // 發放獎金
                try {
                    await fetch('/api/games/crash', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'cashout', betAmount, winAmount: finalWin })
                    });
                    onPointsChange();
                } catch (e) { console.error('發獎失敗', e) }

            } else {
                // 沒中獎
                setGameState('lost');
            }
        }
    };

    const revealAll = () => {
        if (gameState !== 'scratching') return;
        setCells(prev => prev.map(c => ({ ...c, isRevealed: true })));
        checkWinCondition(cells.map(c => ({ ...c, isRevealed: true })));
    };

    return (
        <div className="max-w-4xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 左側：控制面板 */}
                <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                        <span className="text-white/60 font-medium">可用點數</span>
                        <span className="text-emerald-400 font-bold">
                            {userPoints.toLocaleString()} 點
                        </span>
                    </div>

                    <div className="space-y-4 mb-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-400" /> 中獎圖鑑規則
                            </h3>
                            <ul className="text-xs space-y-1.5 text-white/60">
                                <li className="flex justify-between"><span>集滿 3 個 ✨ 阿爾宙斯</span> <span className="text-yellow-300">100 倍</span></li>
                                <li className="flex justify-between"><span>集滿 3 個 🌸 夢幻</span> <span className="text-pink-300">50 倍</span></li>
                                <li className="flex justify-between"><span>集滿 3 個 ⚡ 皮卡丘</span> <span className="text-yellow-500">5 倍</span></li>
                                <li className="flex justify-between"><span>集滿 3 個 🐟 鯉魚王</span> <span className="text-orange-400">0.5 倍 (安慰獎)</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">彩券面額 (下注)</label>
                        <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                disabled={gameState === 'scratching'}
                                className="w-full bg-transparent px-4 py-3 text-white outline-none"
                                min={10}
                                max={userPoints}
                            />
                        </div>
                        {message && <p className="text-red-400 text-xs mt-1">{message}</p>}
                    </div>

                    <div className="mt-auto pt-4">
                        {gameState === 'idle' || gameState === 'won' || gameState === 'lost' ? (
                            <button
                                onClick={buyTicket}
                                disabled={!user || userPoints < 10 || isProcessing}
                                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                            >
                                {gameState === 'idle' ? '購買刮刮樂' : '再來一張！'}
                            </button>
                        ) : (
                            <button
                                onClick={revealAll}
                                className="w-full py-3 flex justify-center items-center gap-2 rounded-xl border border-emerald-500/50 text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> 一鍵全刮
                            </button>
                        )}
                    </div>
                </div>

                {/* 右側：遊戲主畫面 */}
                <div className="md:col-span-2 glass-card p-6 flex flex-col items-center justify-center min-h-[400px]">
                    {gameState === 'idle' ? (
                        <div className="text-center text-white/40">
                            <Ticket className="w-20 h-20 mx-auto mb-4 opacity-50 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-white/80 mb-2">準備好試試手氣了嗎？</h2>
                            <p>點擊左側購買彩券，刮開尋找三個相同的圖案！</p>
                            <p className="text-xs mt-4 text-white/30">警告：刮刮樂擁有極高的「差一點就中」效應，請注意遊玩時間。</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full max-w-sm mx-auto">

                            {/* 九宮格 */}
                            <div className="grid grid-cols-3 gap-2 w-full aspect-square bg-slate-800 p-2 rounded-2xl shadow-inner shadow-black/50 border border-white/5">
                                {cells.map((cell, idx) => (
                                    <button
                                        key={cell.id}
                                        onClick={() => handleScratch(idx)}
                                        disabled={cell.isRevealed || gameState !== 'scratching'}
                                        className={`
                                            relative w-full h-full rounded-xl overflow-hidden transition-all duration-300
                                            ${!cell.isRevealed ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] bg-emerald-700/80 hover:bg-emerald-600 cursor-pointer shadow-md' : 'bg-slate-900 shadow-inner'}
                                        `}
                                    >
                                        {/* 銀色刮膜層 (未刮開) */}
                                        {!cell.isRevealed && (
                                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                        )}

                                        {/* 底下的圖案 (已刮開) */}
                                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${cell.isRevealed ? 'opacity-100' : 'opacity-0 scale-50'}`}>
                                            <span className={`text-4xl md:text-5xl drop-shadow-lg ${REWARD_SYMBOLS[cell.content].color}`}>
                                                {REWARD_SYMBOLS[cell.content].icon}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* 結算訊息 */}
                            {gameState === 'won' && (
                                <div className="mt-8 text-center animate-bounce">
                                    <div className="text-yellow-300 font-bold text-2xl flex items-center gap-2 justify-center">
                                        <Trophy /> 中大獎啦！ <Trophy />
                                    </div>
                                    <div className="text-xl text-white mt-1">
                                        贏得 <span className="text-emerald-400 font-bold">{winAmount.toLocaleString()}</span> 點
                                    </div>
                                </div>
                            )}

                            {gameState === 'lost' && (
                                <div className="mt-8 text-center">
                                    <div className="text-slate-400 font-bold text-xl flex items-center gap-2 justify-center">
                                        <Skull className="w-5 h-5 opacity-50" /> 銘謝惠顧...
                                    </div>
                                    <div className="text-sm text-white/50 mt-2">
                                        差一點點就中了對吧？再來一張一定中！
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
