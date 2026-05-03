"use client";

import { useState } from "react";

export default function InviteCodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const input = document.createElement("input");
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/30"
    >
      {copied ? "✓ 已複製" : "📋 複製"}
    </button>
  );
}
