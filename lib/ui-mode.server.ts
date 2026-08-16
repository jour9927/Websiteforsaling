// 只能在 server component / route handler 用（會拉進 next/headers）。
// client component 請改用 ./ui-mode 裡的常數。
import { cookies } from "next/headers";
import { DEFAULT_UI_MODE, UI_MODE_COOKIE, isUiMode, type UiMode } from "./ui-mode";

/**
 * 在 server component / route handler 讀目前的 UI 版本。
 * 讀不到 cookie 或讀取失敗時，一律使用全站預設的精品卡牌主題。
 */
export function getUiMode(): UiMode {
  try {
    const value = cookies().get(UI_MODE_COOKIE)?.value;
    return isUiMode(value) ? value : DEFAULT_UI_MODE;
  } catch {
    return DEFAULT_UI_MODE;
  }
}
