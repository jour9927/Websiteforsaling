"use client";

import { useState } from "react";

export function ShareLinkButton() {
  const [feedback, setFeedback] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const handleCopy = async () => {
    setBusy(true);
    setFeedback("");

    try {
      const href = window.location.href;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(href);
        setFeedback("連結已複製！");
      } else {
        // Fallback: 選擇文字讓使用者自行複製
        const textArea = document.createElement("textarea");
        textArea.value = href;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          setFeedback("連結已複製！");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy link", err);
      setFeedback("複製失敗，請手動複製網址");
    } finally {
      setBusy(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCopy}
        disabled={busy}
        className="w-full rounded-xl border border-white/20 px-4 py-3 text-center text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        📋 {busy ? "複製中..." : "複製活動連結"}
      </button>
      {feedback && (
        <p className="text-center text-xs text-sky-200">{feedback}</p>
      )}
    </div>
  );
}
