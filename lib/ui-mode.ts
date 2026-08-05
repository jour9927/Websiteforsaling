/**
 * UI 版本切換 — 共用常數與型別
 *
 * v1 = 原本的深色毛玻璃設計（預設，永遠是 fallback）
 * v2 = 明亮清爽的新設計
 *
 * 以 cookie 保存，讓 SSR 與 client 看到的版本一致（避免閃爍）。
 *
 * ⚠️ 這個檔案必須保持 client-safe（不可 import next/headers），
 *    因為 UiModeToggle 是 client component 也要用這些常數。
 *    讀 cookie 的 getUiMode() 在 ./ui-mode.server.ts。
 */

export const UI_MODE_COOKIE = "eg-ui";
export const UI_MODE_MAX_AGE = 60 * 60 * 24 * 365; // 1 年

export type UiMode = "v1" | "v2";

export const DEFAULT_UI_MODE: UiMode = "v1";

export function isUiMode(value: string | undefined | null): value is UiMode {
  return value === "v1" || value === "v2";
}
