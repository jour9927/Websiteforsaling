"use client";

import { useEffect, useState } from "react";

function getSecondsUntilTaipeiMidnight(): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const h = Number(parts.hour) || 0;
  const m = Number(parts.minute) || 0;
  const s = Number(parts.second) || 0;
  return 24 * 3600 - (h * 3600 + m * 60 + s);
}

function format(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function NextResetCountdown({ className = "" }: { className?: string }) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    setSeconds(getSecondsUntilTaipeiMidnight());
    const id = window.setInterval(() => setSeconds(getSecondsUntilTaipeiMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (seconds === null) {
    return (
      <span className={className}>
        距下次額度刷新（台北 00:00）：<span className="font-mono">--:--:--</span>
      </span>
    );
  }

  return (
    <span className={className}>
      距下次額度刷新（台北 00:00）：<span className="font-mono tabular-nums">{format(seconds)}</span>
    </span>
  );
}
