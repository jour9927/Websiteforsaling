export const DAILY_COMMISSION_LIMIT = 5;
export const MAX_COMMISSION_FEE_PERCENT = 80;
export const COMMISSION_PROOF_BUCKET = "commission-proofs";
export const COMMISSION_PROOF_LIMIT = 6;
export const COMMISSION_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const COMMISSION_DEPOSIT_HOLD_DAYS = 10;
export const COMMISSION_DEPOSIT_HOLD_MS =
  COMMISSION_DEPOSIT_HOLD_DAYS * 24 * 60 * 60 * 1000;
export const COMMISSION_DEPOSIT_REMINDER_WINDOW_DAYS = 2;
export const COMMISSION_DEPOSIT_REMINDER_WINDOW_MS =
  COMMISSION_DEPOSIT_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const COMMISSION_DEPOSIT_READY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const COMMISSION_PROOF_ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CommissionProofLink = {
  href: string;
  label: string;
};

export const COMMISSION_STATUSES = [
  "pending_review",
  "queued",
  "open",
  "awaiting_seller_confirmation",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
] as const;

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const COMMISSION_DEPOSIT_REMINDER_STATUSES = [
  "not_applicable",
  "tracking",
  "due_soon",
  "ready",
  "overdue",
  "returned",
] as const;

export type CommissionDepositReminderStatus =
  (typeof COMMISSION_DEPOSIT_REMINDER_STATUSES)[number];

export const COMMISSION_DEPOSIT_NOTIFICATION_TYPES = {
  dueSoon: "commission_deposit_due_soon",
  ready: "commission_deposit_ready",
  overdue: "commission_deposit_overdue",
} as const;

export type CommissionDepositNotificationType =
  (typeof COMMISSION_DEPOSIT_NOTIFICATION_TYPES)[keyof typeof COMMISSION_DEPOSIT_NOTIFICATION_TYPES];

const COMMISSION_DEPOSIT_NOTIFICATION_TYPE_VALUES = Object.values(
  COMMISSION_DEPOSIT_NOTIFICATION_TYPES,
);

export function isCommissionDepositNotificationType(
  value: string,
): value is CommissionDepositNotificationType {
  return COMMISSION_DEPOSIT_NOTIFICATION_TYPE_VALUES.includes(
    value as CommissionDepositNotificationType,
  );
}

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending_review: "待審核",
  queued: "候補排隊",
  open: "開放承接",
  awaiting_seller_confirmation: "待賣家確認",
  in_progress: "執行中",
  completed: "已完成",
  rejected: "退回",
  cancelled: "已取消",
};

export function getCommissionStatusLabel(status: CommissionStatus) {
  return COMMISSION_STATUS_LABELS[status];
}

export function getCommissionDepositReturnDueAt(completedAt: string | null) {
  if (!completedAt) {
    return null;
  }

  const completedDate = new Date(completedAt);
  if (Number.isNaN(completedDate.getTime())) {
    return null;
  }

  return new Date(completedDate.getTime() + COMMISSION_DEPOSIT_HOLD_MS).toISOString();
}

export function isCommissionDepositReturnReady(
  completedAt: string | null,
  now = new Date(),
) {
  const dueAt = getCommissionDepositReturnDueAt(completedAt);
  if (!dueAt) {
    return false;
  }

  return new Date(dueAt).getTime() <= now.getTime();
}

export function getCommissionDepositReminderStatus({
  completedAt,
  depositReturnedAt,
  requiresDeposit,
  now = new Date(),
}: {
  completedAt: string | null;
  depositReturnedAt?: string | null;
  requiresDeposit: boolean;
  now?: Date;
}): CommissionDepositReminderStatus {
  if (!requiresDeposit) {
    return "not_applicable";
  }

  if (depositReturnedAt) {
    return "returned";
  }

  const dueAt = getCommissionDepositReturnDueAt(completedAt);
  if (!dueAt) {
    return "tracking";
  }

  const remainingMs = new Date(dueAt).getTime() - now.getTime();

  if (remainingMs < -COMMISSION_DEPOSIT_READY_WINDOW_MS) {
    return "overdue";
  }

  if (remainingMs <= 0) {
    return "ready";
  }

  if (remainingMs <= COMMISSION_DEPOSIT_REMINDER_WINDOW_MS) {
    return "due_soon";
  }

  return "tracking";
}

export function parseIntegerPercent(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

export function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function normalizeOptionalText(value: unknown, maxLength: number) {
  const normalized = normalizeText(value, maxLength);
  return normalized.length > 0 ? normalized : null;
}

export function isCommissionProofExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isCommissionProofStoragePath(value: string) {
  if (!value || value.startsWith("/") || value.includes("..")) {
    return false;
  }

  return /^[a-zA-Z0-9/_\-.]+$/.test(value) && value.includes("/");
}

export function normalizeProofLinks(value: unknown) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split("\n")
      : [];

  return rawItems
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .filter(
      (item) => isCommissionProofExternalUrl(item) || isCommissionProofStoragePath(item),
    )
    .slice(0, COMMISSION_PROOF_LIMIT);
}

export function sanitizeCommissionProofFileName(fileName: string) {
  const safeFileName = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return safeFileName || "proof-file";
}

export function getCommissionProofLabel(value: string) {
  if (isCommissionProofExternalUrl(value)) {
    try {
      const url = new URL(value);
      const fileName = url.pathname.split("/").filter(Boolean).pop();
      return fileName || url.hostname;
    } catch {
      return value;
    }
  }

  return value.split("/").filter(Boolean).pop() || "proof-file";
}
