"use client";

import { useEffect, useState } from "react";
import { getCountdownTo, ANNIVERSARY_30TH_STARTS_AT } from "@/lib/anniversary30th";

export function Anniversary30thCountdown() {
  const [countdown, setCountdown] = useState(getCountdownTo(ANNIVERSARY_30TH_STARTS_AT));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTo(ANNIVERSARY_30TH_STARTS_AT));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (countdown.isStarted) return null;

  const blocks = [
    { label: "天", value: countdown.days },
    { label: "時", value: countdown.hours },
    { label: "分", value: countdown.minutes },
    { label: "秒", value: countdown.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
        活動倒數
      </p>
      <div className="flex gap-3">
        {blocks.map((block) => (
          <div
            key={block.label}
            className="flex flex-col items-center rounded-2xl border border-amber-400/25 bg-black/40 px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          >
            <span className="text-3xl font-black tabular-nums text-white md:text-4xl">
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[11px] font-medium text-white/50">
              {block.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm text-white/50">
        3/20 20:00 正式開戰
      </p>
    </div>
  );
}
