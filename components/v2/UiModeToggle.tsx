"use client";

import { useState } from "react";
import { UI_MODE_COOKIE, UI_MODE_MAX_AGE, type UiMode } from "@/lib/ui-mode";

/**
 * 一鍵切換新舊 UI。
 *
 * v1 與 v2 都會渲染這顆鈕（樣式在 ui-v2.css 裡分別定義），
 * 所以使用者在任何版本都切得回去。
 *
 * 寫 cookie 後直接 reload：切版牽涉到 <html data-ui> 與整棵 server component
 * 樹，硬重載是最不會出錯的做法，也不會有半新半舊的閃爍。
 */
export function UiModeToggle({ mode }: { mode: UiMode }) {
  const [switching, setSwitching] = useState(false);
  const next: UiMode = mode === "v2" ? "v1" : "v2";

  const handleClick = () => {
    setSwitching(true);
    document.cookie = `${UI_MODE_COOKIE}=${next}; path=/; max-age=${UI_MODE_MAX_AGE}; samesite=lax`;
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={switching}
      className="eg-ui-toggle"
      title={next === "v2" ? "切換到新版介面（測試中）" : "切換回原本的介面"}
      aria-label={next === "v2" ? "切換到新版介面" : "切換回原本的介面"}
    >
      <span aria-hidden="true">{mode === "v2" ? "◑" : "◐"}</span>
      <span>{switching ? "切換中…" : next === "v2" ? "試試新介面" : "回到舊介面"}</span>
    </button>
  );
}
