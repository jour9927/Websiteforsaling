import Link from "next/link";
import { PartyPopper, Zap, Ticket } from "lucide-react";

export const metadata = {
    title: "遊樂場 | Pokémon 配布點數系統",
    description: "體驗刺激的點數遊戲，挑戰你的運氣與膽識！",
};

export default function GamesHubPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent inline-block">
                    🎮 點數遊樂場
                </h1>
                <p className="mt-4 text-white/60 text-lg max-w-2xl mx-auto">
                    歡迎來到多巴胺特區！在這裡，你可以使用手中擁有的配布點數進行挑戰。<br />
                    請注意：賭場如戰場，投資一定有風險，遊戲下注有賺有賠。
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
                {/* 遊戲一：膽小鬼測試 (Crash Game) */}
                <Link href="/games/crash" className="group">
                    <div className="glass-card h-full p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20 border-2 border-transparent hover:border-purple-500/30 flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:animate-pulse">
                            <PartyPopper className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🎈 膽小鬼測試</h2>
                        <h3 className="text-sm text-purple-300 font-semibold mb-4 uppercase tracking-wider">Crash Game</h3>
                        <p className="text-sm text-white/70 flex-grow">
                            倍率無限飆升，但也隨時可能爆炸歸零！考驗貪婪與恐懼的極限拉扯。你能在爆炸前一刻完美跳傘嗎？
                        </p>
                        <div className="mt-6 w-full py-2 bg-white/5 rounded-lg text-xs text-white/50 font-medium">
                            心跳指數：⭐⭐⭐⭐⭐
                        </div>
                    </div>
                </Link>

                {/* 遊戲二：洛托姆的步步驚心 (Risk Box) */}
                <Link href="/games/risk-box" className="group">
                    <div className="glass-card h-full p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-xl hover:shadow-yellow-500/20 border-2 border-transparent hover:border-yellow-500/30 flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/30 group-hover:animate-pulse">
                            <Zap className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">⚡ 步步驚心</h2>
                        <h3 className="text-sm text-yellow-300 font-semibold mb-4 uppercase tracking-wider">Risk Box</h3>
                        <p className="text-sm text-white/70 flex-grow">
                            面前有三個箱子，獎勵不斷翻倍，但只要抽中一次雷電球，前面累積的獎金就全部沒收。你要見好就收，還是拚到底？
                        </p>
                        <div className="mt-6 w-full py-2 bg-white/5 rounded-lg text-xs text-white/50 font-medium">
                            抉擇難度：⭐⭐⭐⭐
                        </div>
                    </div>
                </Link>

                {/* 遊戲三：寶可夢刮刮樂 (Scratch-off) */}
                <Link href="/games/scratch" className="group">
                    <div className="glass-card h-full p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/20 border-2 border-transparent hover:border-emerald-500/30 flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:animate-pulse">
                            <Ticket className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🎫 奇蹟刮刮樂</h2>
                        <h3 className="text-sm text-emerald-300 font-semibold mb-4 uppercase tracking-wider">Scratch & Win</h3>
                        <p className="text-sm text-white/70 flex-grow">
                            享受翻開那一瞬間的快感。永遠都是差一點點就中大獎的最刺激！要不要再來一張？
                        </p>
                        <div className="mt-6 w-full py-2 bg-white/5 rounded-lg text-xs text-white/50 font-medium">
                            手癢指數：⭐⭐⭐⭐⭐
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
