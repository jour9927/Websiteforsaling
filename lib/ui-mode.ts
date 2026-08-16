/**
 * UI 版本切換 — 共用常數與型別
 *
 * v1 = 原本的深色毛玻璃設計（元件在 components/ 根目錄）
 * v2 = 明亮清爽：白底、大留白、細邊框
 * v3 = 精品卡牌：墨黑底、燙金強調、襯線標題、卡片有厚度與光澤（全站預設）
 *
 * v2 與 v3 共用 components/skin/ 底下同一套元件——差別全在 app/ui-skins.css
 * 的 token 層。要再加第四套皮，原則上只要多一個 [data-ui="v4"] 的 token 區塊。
 *
 * 以 cookie 保存，讓 SSR 與 client 看到的版本一致（避免閃爍）。
 *
 * ⚠️ 這個檔案必須保持 client-safe（不可 import next/headers），
 *    因為 UiModeToggle 是 client component 也要用這些常數。
 *    讀 cookie 的 getUiMode() 在 ./ui-mode.server.ts。
 */

export const UI_MODE_COOKIE = "eg-ui";
export const UI_MODE_MAX_AGE = 60 * 60 * 24 * 365; // 1 年

export const UI_MODES = ["v1", "v2", "v3"] as const;

export type UiMode = (typeof UI_MODES)[number];

export const DEFAULT_UI_MODE: UiMode = "v3";

/** 走 components/skin 元件樹的版本（v1 用自己原本那套） */
const SKIN_MODES: readonly UiMode[] = ["v2", "v3"];

export function isSkinMode(mode: UiMode): boolean {
  return SKIN_MODES.includes(mode);
}

export const UI_MODE_LABELS: Record<UiMode, string> = {
  v1: "原介面",
  v2: "明亮清爽",
  v3: "精品卡牌",
};

export function isUiMode(value: string | undefined | null): value is UiMode {
  return UI_MODES.includes(value as UiMode);
}

/** 切換鈕是單鍵循環：v1 → v2 → v3 → v1 */
export function nextUiMode(mode: UiMode): UiMode {
  const i = UI_MODES.indexOf(mode);
  return UI_MODES[(i + 1) % UI_MODES.length];
}
