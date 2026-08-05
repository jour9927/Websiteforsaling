import { NextRequest, NextResponse } from "next/server";
import { UI_MODE_COOKIE, UI_MODE_MAX_AGE, isUiMode } from "@/lib/ui-mode";

export const dynamic = "force-dynamic";

/**
 * GET /ui/v2 或 /ui/v1 — 設定 UI 版本後導回站內頁面。
 *
 * 用途是分享可直接看新版的連結，例如 https://…/ui/v2?next=/store
 * next 只接受站內相對路徑，避免變成開放轉址。
 */
export function GET(req: NextRequest, { params }: { params: { mode: string } }) {
  const mode = params.mode;

  if (!isUiMode(mode)) {
    return NextResponse.json(
      { error: "mode 只接受 v1 或 v2" },
      { status: 400 },
    );
  }

  const requested = req.nextUrl.searchParams.get("next");
  // 只允許站內單斜線開頭的路徑（擋掉 //evil.com 與 https://evil.com）
  const target =
    requested && /^\/(?!\/)[\w\-./?=&%#]*$/.test(requested) ? requested : "/";

  const res = NextResponse.redirect(new URL(target, req.nextUrl.origin));
  res.cookies.set(UI_MODE_COOKIE, mode, {
    path: "/",
    maxAge: UI_MODE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}
