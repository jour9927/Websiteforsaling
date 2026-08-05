import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

/* 這些都是無 hook 的純顯示元件，server / client component 都能直接用。 */

/* ---------------------------------------------------------------- Section */

export function SectionHead({
  title,
  count,
  countTone = "default",
  action,
}: {
  title: string;
  count?: ReactNode;
  countTone?: "default" | "success" | "warn" | "accent";
  action?: { label: string; href: Route };
}) {
  const toneClass =
    countTone === "success"
      ? "eg-tag--success"
      : countTone === "warn"
        ? "eg-tag--warn"
        : countTone === "accent"
          ? "eg-tag--accent"
          : "";

  return (
    <div className="eg-section-head mb-5">
      <div className="flex items-baseline gap-2.5">
        <h2 className="eg-h2">{title}</h2>
        {count !== undefined && count !== null && (
          <span className={`eg-tag ${toneClass} eg-num`}>{count}</span>
        )}
      </div>
      {action && (
        <Link href={action.href} className="eg-link flex-none">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Empty */

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { label: string; href: Route };
}) {
  return (
    <div className="eg-card eg-card--subtle flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="eg-h3" style={{ color: "var(--eg-ink-2)" }}>
        {title}
      </p>
      {hint && <p className="eg-meta">{hint}</p>}
      {action && (
        <Link href={action.href} className="eg-btn eg-btn--secondary eg-btn--sm mt-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- LoginWall */

/**
 * v1 MemberOnlyBlock 的亮色版：模糊骨架 + 登入引導。
 * 保留同樣的心智模型（後面有東西，登入就看得到），但換成留白多的做法。
 */
export function LoginWall({
  title,
  description = "登入後即可查看完整內容",
  itemCount = 2,
  redirect,
}: {
  title: string;
  description?: string;
  itemCount?: number;
  redirect?: string;
}) {
  const loginHref = (redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login") as Route;

  return (
    <div className="eg-card relative overflow-hidden">
      {/* 背後的骨架，暗示這裡本來有內容 */}
      <div className="flex flex-col gap-3 p-5" aria-hidden="true">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="eg-skeleton h-28 w-full" />
        ))}
      </div>

      {/* 白色漸層蓋住骨架下半，文字區才乾淨 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.95) 45%, #fff 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center px-6 pb-12 pt-4 text-center">
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "var(--eg-bg-muted)", color: "var(--eg-ink-3)" }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h3 className="eg-h3">{title}</h3>
        <p className="eg-meta mt-1.5 max-w-sm">{description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <Link href={loginHref} className="eg-btn eg-btn--primary eg-btn--sm">
            登入
          </Link>
          <Link href="/signup" className="eg-btn eg-btn--secondary eg-btn--sm">
            註冊會員
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Stat */

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="eg-card px-5 py-4">
      <p className="eg-meta">{label}</p>
      <p
        className="eg-num mt-1 text-[26px] font-semibold leading-none"
        style={{ color: "var(--eg-ink)" }}
      >
        {value}
      </p>
      {hint && <p className="eg-meta mt-1.5">{hint}</p>}
    </div>
  );
}

/* --------------------------------------------------------------- Legacy 島 */

/**
 * 還沒改版的 v1 元件包這個。
 * v1 元件的樣式是寫死的深色 utility class，硬放在白底上會像壞掉，
 * 包成一塊深色面板反而看起來是刻意的設計，功能也一個都不會少。
 */
export function LegacyPanel({
  note = "這個區塊還沒改版，暫時維持原本的介面",
  children,
}: {
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="eg-legacy">
      <p className="eg-legacy-note">
        <span aria-hidden="true">◐</span>
        {note}
      </p>
      {children}
    </div>
  );
}
