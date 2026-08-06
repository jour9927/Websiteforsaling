"use client";

import { useState } from "react";
import {
  UI_MODE_COOKIE,
  UI_MODE_LABELS,
  UI_MODE_MAX_AGE,
  nextUiMode,
  type UiMode,
} from "@/lib/ui-mode";

/**
 * 一鍵循環切換介面：v1 → v2 → v3 → v1。
 *
 * 三個版本都會渲染這顆鈕（樣式在 ui-skins.css 裡依 data-ui 分別定義），
 * 所以使用者在任何版本都切得出去、也切得回來。
 *
 * 寫 cookie 後直接 reload：切版牽涉到 <html data-ui> 與整棵 server component
 * 樹，硬重載是最不會出錯的做法，也不會有半新半舊的閃爍。
 */
export function UiModeToggle({ mode }: { mode: UiMode }) {
  const [switching, setSwitching] = useState(false);
  const next = nextUiMode(mode);

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
      title={`目前是「${UI_MODE_LABELS[mode]}」，點一下切到「${UI_MODE_LABELS[next]}」`}
      aria-label={`切換介面到 ${UI_MODE_LABELS[next]}`}
    >
      <span aria-hidden="true">◑</span>
      <span>{switching ? "切換中…" : UI_MODE_LABELS[next]}</span>
    </button>
  );
}
