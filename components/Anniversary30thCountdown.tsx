"use client";

import { useEffect, useState } from "react";
import { getCountdownTo, ANNIVERSARY_30TH_STARTS_AT } from "@/lib/anniversary30th";

type Anniversary30thCountdownProps = {
  startsAt?: string;
};

export function Anniversary30thCountdown({
  startsAt = ANNIVERSARY_30TH_STARTS_AT,
}: Anniversary30thCountdownProps) {
  const [countdown, setCountdown] = useState(getCountdownTo(startsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTo(startsAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [startsAt]);

  if (countdown.isStarted) return null;

  const blocks = [
    { label: "天", value: countdown.days },
    { label: "時", value: countdown.hours },
    { label: "分", value: countdown.minutes },
    { label: "秒", value: countdown.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/75">
        開戰倒數
      </p>
      <div className="flex gap-3">
        {blocks.map((block) => (
          <div
            key={block.label}
            className="flex flex-col items-center rounded-lg border border-white/12 bg-black/40 px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.32)]"
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
        4/25 00:00 正式開戰
      </p>
    </div>
  );
}
