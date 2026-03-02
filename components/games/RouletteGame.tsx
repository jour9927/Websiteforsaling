"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RouletteGame({ initialTickets, initialPoints }: { initialTickets: number; initialPoints: number }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  
  const [currentTickets, setCurrentTickets] = useState(initialTickets);
  const [currentPoints, setCurrentPoints] = useState(initialPoints);

  const startSpin = async () => {
    if (currentTickets < 1) {
      alert("目前沒有抽獎券喔！請透過每日打卡獲取。");
      return;
    }

    setLoading(true);
    setSpinning(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/games/roulette", {
        method: "POST"
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "發生錯誤");
      }

      // Simulate a spin delay so the animation keeps playing for a bit
      setTimeout(() => {
        setSpinning(false);
        setResultMessage(data.prizeName);
        setCurrentTickets(data.newTickets);
        setCurrentPoints(data.newPoints);
        setLoading(false);
        router.refresh();
      }, 2000);

    } catch (err: any) {
      alert(err.message);
      setSpinning(false);
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      
      <div className="mb-6 flex gap-8 text-lg font-bold">
        <div className="flex flex-col items-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-amber-300">
          <span>擁有点數</span>
          <span className="text-2xl">{currentPoints.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <span>時光抽獎券</span>
          <span className="text-2xl">{currentTickets} 券</span>
        </div>
      </div>

      <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
        {/* Glowing border */ }
        <div className={`absolute inset-0 rounded-full border-4 shadow-[0_0_20px_rgba(251,146,60,0.6)] border-orange-500 transition-all duration-300 ${spinning ? "animate-spin border-t-rose-500 border-r-amber-500 border-b-emerald-500 border-l-sky-500" : ""}`}></div>
        
        {/* Center content */}
        <div className="z-10 text-center flex flex-col items-center justify-center">
          {spinning ? (
            <div className="text-4xl animate-bounce">⏱️</div>
          ) : resultMessage ? (
            <div className="p-4 bg-black/60 rounded-xl max-w-[200px] border border-white/20">
               <p className="text-lg text-emerald-300 font-bold">{resultMessage}</p>
            </div>
          ) : (
            <div className="text-4xl text-white/50">🎯</div>
          )}
        </div>
      </div>

      <button
        onClick={startSpin}
        disabled={loading || currentTickets < 1}
        className={`px-8 py-3 text-lg font-bold rounded-xl transition-all shadow-xl ` + 
          (currentTickets < 1 
            ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
            : spinning ? "bg-rose-600/50 text-white/50 cursor-wait shadow-none" : "bg-gradient-to-r from-rose-500 to-orange-500 hover:scale-110 active:scale-95 text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.6)]")}
      >
        {spinning ? "轉動中..." : "開始轉動 (耗費 1 券)"}
      </button>

      {/* Prize Pool Info */}
      <div className="mt-8 text-sm text-slate-400 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-2 border border-white/5 rounded-lg text-center">🏆 大賞 (1%)<br/>3000 pts</div>
        <div className="p-2 border border-white/5 rounded-lg text-center">⭐ 特賞 (5%)<br/>1996 pts</div>
        <div className="p-2 border border-white/5 rounded-lg text-center">🎯 參賞 (10%)<br/>300 pts</div>
        <div className="p-2 border border-white/5 rounded-lg text-center">🎲 普賞 (34%)<br/>30 pts</div>
        <div className="p-2 border border-white/5 rounded-lg text-center">🍀 幸運 (20%)<br/>再來一次</div>
        <div className="p-2 border border-white/5 rounded-lg text-center">⏳ 沙漏 (30%)<br/>銘謝惠顧</div>
      </div>

    </div>
  );
}
