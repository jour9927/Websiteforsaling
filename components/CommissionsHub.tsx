"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  COMMISSION_DEPOSIT_HOLD_DAYS,
  COMMISSION_PROOF_ALLOWED_TYPES,
  COMMISSION_PROOF_BUCKET,
  COMMISSION_PROOF_LIMIT,
  COMMISSION_PROOF_MAX_BYTES,
  type CommissionProofLink,
  DAILY_COMMISSION_LIMIT,
  getCommissionDepositReminderStatus,
  sanitizeCommissionProofFileName,
  type CommissionStatus,
  getCommissionStatusLabel,
} from "@/lib/commissions";
import { supabase } from "@/lib/supabase";

export type CommissionViewer = {
  id: string | null;
  fullName: string | null;
  role: string | null;
  isAdmin: boolean;
  needsDepositOnCreate: boolean;
};

export type CommissionDistributionOption = {
  id: string;
  pokemonName: string;
  pokemonNameEn: string | null;
  originalTrainer: string | null;
};

export type CommissionItem = {
  id: string;
  title: string;
  description: string;
  status: CommissionStatus;
  processingDate: string | null;
  createdAt: string;
  completedAt: string | null;
  depositReturnedAt: string | null;
  depositReturnDueAt: string | null;
  depositReturnReady: boolean;
  sellerFeePercent: number;
  executorFeePercent: number | null;
  executorFeeApproved: boolean;
  isFirstTimeClient: boolean;
  depositDetails: string | null;
  proofLinks: CommissionProofLink[];
  proofCount: number;
  reviewNote: string | null;
  distributionName: string;
  distributionSubtitle: string | null;
  creatorId: string;
  creatorName: string;
  executorId: string | null;
  executorName: string | null;
  isCreator: boolean;
  isExecutor: boolean;
};

type CommissionsHubProps = {
  viewer: CommissionViewer;
  distributions: CommissionDistributionOption[];
  commissions: CommissionItem[];
};

type UploadedProof = {
  path: string;
  name: string;
  size: number;
};

const STATUS_SECTIONS: Array<{
  status: CommissionStatus;
  title: string;
  description: string;
}> = [
  {
    status: "pending_review",
    title: "待人工審核",
    description: "已送件，等待平台確認文件與合法性。",
  },
  {
    status: "queued",
    title: "候補排隊",
    description: "當日名額已滿，案件已排入後續處理名單。",
  },
  {
    status: "open",
    title: "開放承接",
    description: "已通過審核，任何站內會員皆可承接。",
  },
  {
    status: "awaiting_seller_confirmation",
    title: "待賣家確認執行抽成",
    description: "承接者已提出抽成條件，等待刊登者同意。",
  },
  {
    status: "in_progress",
    title: "執行中",
    description: "已完成媒合，可持續追蹤進度與結案。",
  },
  {
    status: "completed",
    title: "已完成",
    description: "案件已結案，等待後續押底退還或備查。",
  },
  {
    status: "rejected",
    title: "退回案件",
    description: "審核未通過，需要補件或重送。",
  },
  {
    status: "cancelled",
    title: "已取消",
    description: "案件已被平台或相關方終止。",
  },
];

const statusPillClasses: Record<CommissionStatus, string> = {
  pending_review: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  queued: "border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-100",
  open: "border-cyan-400/35 bg-cyan-400/10 text-cyan-100",
  awaiting_seller_confirmation: "border-orange-400/35 bg-orange-400/10 text-orange-100",
  in_progress: "border-emerald-400/35 bg-emerald-400/10 text-emerald-100",
  completed: "border-white/20 bg-white/10 text-white/85",
  rejected: "border-rose-400/35 bg-rose-400/10 text-rose-100",
  cancelled: "border-slate-400/35 bg-slate-400/10 text-slate-100",
};

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDate(value: string | null) {
  if (!value) {
    return "未排定";
  }

  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "尚未更新";
  }

  return dateTimeFormatter.format(new Date(value));
}

function getDepositReminderStatus(commission: CommissionItem) {
  return getCommissionDepositReminderStatus({
    completedAt: commission.completedAt,
    depositReturnedAt: commission.depositReturnedAt,
    requiresDeposit: commission.isFirstTimeClient && Boolean(commission.depositDetails),
  });
}

function getDepositStatusLabel(commission: CommissionItem) {
  if (!commission.isFirstTimeClient) {
    return "非首次委託，無需押底";
  }

  if (!commission.depositDetails) {
    return "首次委託，待補押底資訊";
  }

  if (commission.depositReturnedAt) {
    return "押底已歸還";
  }

  const reminderStatus = getDepositReminderStatus(commission);

  if (reminderStatus === "overdue") {
    return "押底已逾期待歸還";
  }

  if (reminderStatus === "ready") {
    return "押底可立即歸還";
  }

  if (reminderStatus === "due_soon" && commission.depositReturnDueAt) {
    return `押底將於 ${formatDateTime(commission.depositReturnDueAt)} 到期`;
  }

  if (commission.status === "completed" && commission.depositReturnDueAt) {
    return `押底保留至 ${formatDateTime(commission.depositReturnDueAt)}`;
  }

  return "押底保留中，待委託完成";
}

function getDepositStatusDescription(commission: CommissionItem) {
  if (!commission.isFirstTimeClient) {
    return "僅首次委託需要提供平台押底。";
  }

  if (!commission.depositDetails) {
    return "需要補上押底寶可夢與估值資訊後，案件才算完整。";
  }

  if (commission.depositReturnedAt) {
    return `平台已於 ${formatDateTime(commission.depositReturnedAt)} 完成押底歸還。`;
  }

  const reminderStatus = getDepositReminderStatus(commission);

  if (reminderStatus === "overdue" && commission.depositReturnDueAt) {
    return `已超過可歸還時間 24 小時以上，原訂 ${formatDateTime(commission.depositReturnDueAt)} 可歸還，請管理員優先確認。`;
  }

  if (reminderStatus === "ready") {
    return `已滿 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，可由管理員確認無異常後辦理押底歸還。`;
  }

  if (reminderStatus === "due_soon" && commission.depositReturnDueAt) {
    return `距離可歸還時間剩不到 48 小時，預計 ${formatDateTime(commission.depositReturnDueAt)} 可歸還。`;
  }

  if (commission.status === "completed" && commission.depositReturnDueAt) {
    return `完成後需保留 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，期滿無異常即可歸還。`;
  }

  return `委託完成後仍需保留 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，再辦理押底歸還。`;
}

function StatusPill({ status }: { status: CommissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] ${statusPillClasses[status]}`}
    >
      {getCommissionStatusLabel(status)}
    </span>
  );
}

function StatsCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200/70">{description}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  children,
  variant = "default",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: string;
  variant?: "default" | "danger" | "success";
}) {
  const styles =
    variant === "danger"
      ? "border-rose-500/35 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20"
      : variant === "success"
        ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20"
        : "border-white/15 bg-white/10 text-white hover:bg-white/15";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function hasSupportedProofType(file: File) {
  if (COMMISSION_PROOF_ALLOWED_TYPES.includes(file.type as (typeof COMMISSION_PROOF_ALLOWED_TYPES)[number])) {
    return true;
  }

  const normalizedName = file.name.toLowerCase();
  return (
    normalizedName.endsWith(".pdf") ||
    normalizedName.endsWith(".jpg") ||
    normalizedName.endsWith(".jpeg") ||
    normalizedName.endsWith(".png") ||
    normalizedName.endsWith(".webp")
  );
}

export default function CommissionsHub({
  viewer,
  distributions,
  commissions,
}: CommissionsHubProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedProofs, setUploadedProofs] = useState<UploadedProof[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [sellerFeePercent, setSellerFeePercent] = useState("0");
  const [depositDetails, setDepositDetails] = useState("");
  const [distributionId, setDistributionId] = useState(distributions[0]?.id ?? "");
  const [executorFees, setExecutorFees] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!distributionId && distributions[0]?.id) {
      setDistributionId(distributions[0].id);
    }
  }, [distributionId, distributions]);

  const groupedCommissions = useMemo(() => {
    return STATUS_SECTIONS.map((section) => ({
      ...section,
      items: commissions.filter((commission) => commission.status === section.status),
    })).filter((section) => section.items.length > 0);
  }, [commissions]);

  const stats = useMemo(() => {
    return {
      open: commissions.filter((commission) => commission.status === "open").length,
      pending: commissions.filter(
        (commission) =>
          commission.status === "pending_review" || commission.status === "queued",
      ).length,
      active: commissions.filter(
        (commission) =>
          commission.status === "awaiting_seller_confirmation" ||
          commission.status === "in_progress",
      ).length,
    };
  }, [commissions]);

  const remainingProofSlots = COMMISSION_PROOF_LIMIT - uploadedProofs.length;

  async function runAction(
    actionKey: string,
    request: () => Promise<Response>,
    successMessage: string,
  ) {
    setActiveAction(actionKey);
    setError("");
    setSuccess("");

    try {
      const response = await request();
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "操作失敗，請稍後再試。");
      }

      setSuccess(successMessage);
      router.refresh();
      return true;
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "操作失敗，請稍後再試。",
      );
      return false;
    } finally {
      setActiveAction(null);
    }
  }

  async function removeUploadedProof(path: string, successMessage?: string) {
    const target = uploadedProofs.find((proof) => proof.path === path);
    if (!target) {
      return true;
    }

    setUploadingProof(true);
    setError("");

    try {
      const { error: removeError } = await supabase
        .storage
        .from(COMMISSION_PROOF_BUCKET)
        .remove([path]);

      if (removeError) {
        throw new Error(removeError.message);
      }

      setUploadedProofs((current) => current.filter((proof) => proof.path !== path));
      if (successMessage) {
        setSuccess(successMessage);
      }

      return true;
    } catch (removeActionError) {
      setError(
        removeActionError instanceof Error
          ? removeActionError.message
          : "刪除文件失敗，請稍後再試。",
      );
      return false;
    } finally {
      setUploadingProof(false);
    }
  }

  async function handleProofUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    if (!viewer.id) {
      setError("請先登入後再上傳領取文件。");
      return;
    }

    setError("");
    setSuccess("");

    if (remainingProofSlots <= 0) {
      setError(`領取文件最多只能上傳 ${COMMISSION_PROOF_LIMIT} 份。`);
      return;
    }

    if (files.length > remainingProofSlots) {
      setError(`目前最多還能再上傳 ${remainingProofSlots} 份領取文件。`);
      return;
    }

    const unsupportedFile = files.find((file) => !hasSupportedProofType(file));
    if (unsupportedFile) {
      setError(`「${unsupportedFile.name}」格式不支援，僅接受 PDF、JPG、PNG、WEBP。`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > COMMISSION_PROOF_MAX_BYTES);
    if (oversizedFile) {
      setError(
        `「${oversizedFile.name}」超過 ${formatFileSize(COMMISSION_PROOF_MAX_BYTES)} 上限。`,
      );
      return;
    }

    setUploadingProof(true);

    const createdPaths: string[] = [];
    const nextProofs: UploadedProof[] = [];

    try {
      for (const file of files) {
        const safeName = sanitizeCommissionProofFileName(file.name);
        const path = `${viewer.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase
          .storage
          .from(COMMISSION_PROOF_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type || undefined,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`「${file.name}」上傳失敗：${uploadError.message}`);
        }

        createdPaths.push(path);
        nextProofs.push({
          path,
          name: file.name,
          size: file.size,
        });
      }

      setUploadedProofs((current) => [...current, ...nextProofs]);
      setSuccess(
        nextProofs.length === 1
          ? `已上傳 1 份領取文件。`
          : `已上傳 ${nextProofs.length} 份領取文件。`,
      );
    } catch (uploadActionError) {
      if (createdPaths.length > 0) {
        await supabase.storage.from(COMMISSION_PROOF_BUCKET).remove(createdPaths);
      }

      setError(
        uploadActionError instanceof Error
          ? uploadActionError.message
          : "文件上傳失敗，請稍後再試。",
      );
    } finally {
      setUploadingProof(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isCreated = await runAction(
      "create",
      () =>
        fetch("/api/commissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            distributionId,
            sellerFeePercent,
            title,
            description,
            proofLinks: uploadedProofs.map((proof) => proof.path),
            depositDetails,
          }),
        }),
      "委託已送出，已進入審核流程。",
    );

    if (!isCreated) {
      return;
    }

    setTitle("");
    setDescription("");
    setUploadedProofs([]);
    setSellerFeePercent("0");
    setDepositDetails("");
  }

  function handleAccept(commissionId: string) {
    const executorFeePercent = executorFees[commissionId] ?? "0";

    void runAction(
      `accept:${commissionId}`,
      () =>
        fetch(`/api/commissions/${commissionId}/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ executorFeePercent }),
        }),
      Number.parseInt(executorFeePercent, 10) > 0
        ? "承接申請已送出，等待刊登者確認執行抽成。"
        : "委託已承接，案件進入執行中。",
    );
  }

  function handleSellerConfirmation(commissionId: string, approved: boolean) {
    void runAction(
      `seller:${commissionId}:${approved ? "approve" : "reject"}`,
      () =>
        fetch(`/api/commissions/${commissionId}/executor-fee`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ approved }),
        }),
      approved
        ? "已同意執行抽成，案件進入執行中。"
        : "已拒絕此抽成提案，案件重新開放承接。",
    );
  }

  function handleAdminStatus(commissionId: string, status: string) {
    const reviewNote = adminNotes[commissionId] ?? "";

    void runAction(
      `admin:${commissionId}:${status}`,
      () =>
        fetch(`/api/admin/commissions/${commissionId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, reviewNote }),
        }),
      status === "open"
        ? "案件已通過審核並開放承接。"
        : status === "rejected"
          ? "案件已退回。"
          : status === "completed"
            ? "案件已標記完成。"
            : "案件已取消。",
    );
  }

  function handleAdminDepositReturn(commissionId: string) {
    void runAction(
      `deposit-return:${commissionId}`,
      () =>
        fetch(`/api/admin/commissions/${commissionId}/deposit-return`, {
          method: "PATCH",
        }),
      "已完成押底歸還登記。",
    );
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">Live Board</p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
            場外委託看板
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-200/75 md:text-base">
            這裡會直接顯示已送件、排隊、可承接與執行中的委託案件。每位已登入用戶都可以建立委託，
            也可以承接其他人的委託；案件中的寶可夢資料則統一連到配布圖鑑比對。
          </p>
        </div>
        <Link
          href="/pokedex"
          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          配布圖鑑
        </Link>
      </div>

      {!viewer.id ? (
        <div className="mt-8 rounded-[28px] border border-cyan-300/20 bg-cyan-400/10 p-6 md:p-8">
          <h3 className="text-xl font-semibold text-white">登入後即可查看與建立委託</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-100/85">
            委託看板與操作流程目前僅對站內已登入會員開放。登入後即可建立委託、承接案件，
            並追蹤人工審核與賣家確認狀態。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?redirect=/commissions"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
            >
              前往登入
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              建立帳號
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatsCard
              label="可承接委託"
              value={stats.open}
              description="已通過人工審核，現正開放承接的案件數。"
            />
            <StatsCard
              label="待處理佇列"
              value={stats.pending}
              description={`包含待審核與候補排隊中的案件，平台每日處理上限 ${DAILY_COMMISSION_LIMIT} 件。`}
            />
            <StatsCard
              label="媒合進行中"
              value={stats.active}
              description="承接已送出或已進入執行中的委託數。"
            />
          </div>

          {(error || success) && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                error
                  ? "border-rose-500/35 bg-rose-500/10 text-rose-100"
                  : "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
              }`}
            >
              {error || success}
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Create Request
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">建立委託單</h3>
                </div>
                <p className="text-sm text-slate-200/65">
                  領取文件改為站內私有上傳，僅平台與案件相關方可查看。
                </p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleCreate}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/85">配布圖鑑項目</span>
                  <select
                    value={distributionId}
                    onChange={(event) => setDistributionId(event.target.value)}
                    disabled={distributions.length === 0 || activeAction === "create"}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                  >
                    {distributions.length === 0 ? (
                      <option value="">目前尚無配布圖鑑資料</option>
                    ) : (
                      distributions.map((distribution) => (
                        <option key={distribution.id} value={distribution.id}>
                          {distribution.pokemonName}
                          {distribution.pokemonNameEn
                            ? ` / ${distribution.pokemonNameEn}`
                            : ""}
                          {distribution.originalTrainer
                            ? ` / OT ${distribution.originalTrainer}`
                            : ""}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/85">委託標題</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={120}
                      disabled={activeAction === "create"}
                      className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                      placeholder="例如：代領 XYZ 配布蒼響"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/85">賣家抽成 %</span>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={sellerFeePercent}
                      onChange={(event) => setSellerFeePercent(event.target.value)}
                      disabled={activeAction === "create"}
                      className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/85">委託描述</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={2000}
                    rows={5}
                    disabled={activeAction === "create"}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/40"
                    placeholder="請說明希望代領的版本、時段、交付方式與任何額外限制。"
                  />
                </label>

                <div className="space-y-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/90">領取文件上傳</p>
                      <p className="mt-1 text-sm leading-6 text-slate-200/70">
                        支援 PDF、JPG、PNG、WEBP，單檔上限{" "}
                        {formatFileSize(COMMISSION_PROOF_MAX_BYTES)}，最多可上傳{" "}
                        {COMMISSION_PROOF_LIMIT} 份。文件僅平台、刊登者與執行者可查看。
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        onChange={handleProofUpload}
                        disabled={
                          uploadingProof ||
                          activeAction === "create" ||
                          remainingProofSlots <= 0
                        }
                        className="sr-only"
                      />
                      {uploadingProof
                        ? "上傳中..."
                        : remainingProofSlots <= 0
                          ? "已達上限"
                          : "選擇文件"}
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-cyan-100/75">
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                      已上傳 {uploadedProofs.length} / {COMMISSION_PROOF_LIMIT}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                      尚可上傳 {Math.max(remainingProofSlots, 0)} 份
                    </span>
                  </div>

                  {uploadedProofs.length > 0 && (
                    <div className="space-y-2">
                      {uploadedProofs.map((proof) => (
                        <div
                          key={proof.path}
                          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {proof.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-300/55">
                              {formatFileSize(proof.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void removeUploadedProof(
                                proof.path,
                                "已移除 1 份領取文件。",
                              )
                            }
                            disabled={uploadingProof || activeAction === "create"}
                            className="inline-flex items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {viewer.needsDepositOnCreate && (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/85">首次委託押底說明</span>
                    <textarea
                      value={depositDetails}
                      onChange={(event) => setDepositDetails(event.target.value)}
                      rows={4}
                      disabled={activeAction === "create"}
                      className="w-full rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-amber-300/40"
                      placeholder="請填寫押底寶可夢、估值與可供平台核對的資訊。"
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={
                    activeAction === "create" ||
                    distributions.length === 0 ||
                    uploadingProof ||
                    uploadedProofs.length === 0
                  }
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction === "create" ? "送出中..." : "送出委託"}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Your Access</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {viewer.fullName || "已登入會員"}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-200/70">
                  {viewer.isAdmin
                    ? "你目前具有管理權限，可審核、退回、取消或結案委託。"
                    : "你目前可建立委託、承接他人委託，並追蹤自己相關案件。"}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-200/75">
                  <p>角色：{viewer.isAdmin ? "管理員" : viewer.role || "會員"}</p>
                  <p>
                    首次委託押底：
                    {viewer.needsDepositOnCreate ? " 這次建立時必填" : " 已完成首次委託資料"}
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Quick Rules</p>
                <h3 className="mt-2 text-xl font-semibold text-white">平台限制</h3>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-200/72">
                  <p>每日平台僅處理 {DAILY_COMMISSION_LIMIT} 件新委託，超出後自動排隊。</p>
                  <p>執行抽成與賣家抽成都不可超過委託價值的 4/5。</p>
                  <p>領取文件與押底細節只會提供給委託相關方與管理員查看。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {groupedCommissions.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.025] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-white">目前尚無可顯示的委託案件</p>
                <p className="mt-2 text-sm text-slate-200/65">
                  你可以先建立第一筆委託，或等待平台審核後再回來查看媒合狀態。
                </p>
              </div>
            ) : (
              groupedCommissions.map((section) => (
                <section key={section.status} className="space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                      <p className="mt-1 text-sm text-slate-200/65">{section.description}</p>
                    </div>
                    <p className="text-sm text-white/45">{section.items.length} 件</p>
                  </div>

                  <div className="grid gap-4">
                    {section.items.map((commission) => (
                      <article
                        key={commission.id}
                        id={`commission-${commission.id}`}
                        className="scroll-mt-28 rounded-[30px] border border-white/10 bg-white/[0.035] p-6"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <StatusPill status={commission.status} />
                              {commission.isCreator && (
                                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                  你是刊登者
                                </span>
                              )}
                              {commission.isExecutor && (
                                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                                  你是執行者
                                </span>
                              )}
                              {commission.isFirstTimeClient && (
                                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
                                  首次委託
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="text-xl font-semibold text-white">
                                {commission.title}
                              </h4>
                              <p className="mt-2 text-sm font-medium text-cyan-100">
                                {commission.distributionName}
                              </p>
                              {commission.distributionSubtitle && (
                                <p className="mt-1 text-sm text-slate-200/55">
                                  {commission.distributionSubtitle}
                                </p>
                              )}
                            </div>

                            <p className="max-w-4xl text-sm leading-7 text-slate-200/75">
                              {commission.description}
                            </p>
                          </div>

                          <div className="min-w-[180px] rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-4 text-sm text-slate-200/75">
                            <p>刊登者：{commission.creatorName}</p>
                            <p className="mt-2">
                              建立時間：{formatDateTime(commission.createdAt)}
                            </p>
                            <p className="mt-2">
                              處理日期：{formatDate(commission.processingDate)}
                            </p>
                            {commission.executorName && (
                              <p className="mt-2">執行者：{commission.executorName}</p>
                            )}
                            {commission.completedAt && (
                              <p className="mt-2">
                                完成時間：{formatDateTime(commission.completedAt)}
                              </p>
                            )}
                            {commission.depositReturnedAt && (
                              <p className="mt-2">
                                押底歸還：{formatDateTime(commission.depositReturnedAt)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-200/75">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                              賣家抽成
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                              {commission.sellerFeePercent}%
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-200/75">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                              執行抽成
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                              {commission.executorFeePercent ?? 0}%
                            </p>
                            <p className="mt-1 text-xs text-slate-300/50">
                              {commission.executorFeeApproved ? "已確認" : "待確認 / 未設定"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-200/75">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                              領取文件
                            </p>
                            <p className="mt-2 text-sm leading-6 text-white/85">
                              {commission.proofCount > 0
                                ? `${commission.proofCount} 份已上傳`
                                : "僅相關方可見"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-200/75">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                              押底狀態
                            </p>
                            <p className="mt-2 text-sm leading-6 text-white/85">
                              {getDepositStatusLabel(commission)}
                            </p>
                            <p className="mt-2 text-xs leading-6 text-slate-300/55">
                              {getDepositStatusDescription(commission)}
                            </p>
                          </div>
                        </div>

                        {(commission.depositDetails || commission.proofCount > 0) && (
                          <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            {commission.depositDetails && (
                              <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
                                  押底說明
                                </p>
                                <p className="mt-3 text-sm leading-7 text-amber-50/90">
                                  {commission.depositDetails}
                                </p>
                                <p className="mt-3 text-sm leading-7 text-amber-100/75">
                                  {getDepositStatusDescription(commission)}
                                </p>
                              </div>
                            )}

                            {commission.proofCount > 0 && (
                              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
                                  領取文件
                                </p>
                                <p className="mt-3 text-sm text-cyan-50/85">
                                  共 {commission.proofCount} 份
                                </p>
                                {commission.proofLinks.length > 0 ? (
                                  <div className="mt-3 flex flex-col gap-2">
                                    {commission.proofLinks.map((proof) => (
                                      <a
                                        key={`${proof.href}-${proof.label}`}
                                        href={proof.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="truncate text-sm text-cyan-100 transition hover:text-white"
                                      >
                                        {proof.label}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm leading-6 text-cyan-50/75">
                                    文件已上傳，暫時無法產生安全連結，請稍後再試。
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {viewer.isAdmin &&
                          commission.isFirstTimeClient &&
                          commission.depositDetails &&
                          commission.status === "completed" && (
                            <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">
                                押底歸還管理
                              </p>
                              <p className="mt-3 text-sm leading-7 text-emerald-50/90">
                                {commission.depositReturnedAt
                                  ? `押底已於 ${formatDateTime(commission.depositReturnedAt)} 歸還。`
                                  : getDepositReminderStatus(commission) === "overdue" &&
                                      commission.depositReturnDueAt
                                    ? `押底已超過保留期，原訂 ${formatDateTime(commission.depositReturnDueAt)} 可歸還，請優先確認。`
                                    : getDepositReminderStatus(commission) === "ready"
                                      ? `押底保留期已滿 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，可立即辦理歸還。`
                                      : commission.depositReturnDueAt
                                        ? `此案完成後需保留 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，預計可於 ${formatDateTime(commission.depositReturnDueAt)} 辦理歸還。`
                                        : `此案完成後需保留 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，再辦理押底歸還。`}
                              </p>
                              {!commission.depositReturnedAt && (
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                  <ActionButton
                                    onClick={() => handleAdminDepositReturn(commission.id)}
                                    disabled={
                                      activeAction === `deposit-return:${commission.id}` ||
                                      !commission.depositReturnReady
                                    }
                                    variant="success"
                                  >
                                    {activeAction === `deposit-return:${commission.id}`
                                      ? "處理中..."
                                      : "確認歸還押底"}
                                  </ActionButton>
                                  {!commission.depositReturnReady && (
                                    <p className="text-sm text-emerald-100/70">
                                      {commission.depositReturnDueAt
                                        ? `尚未滿 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，需等到 ${formatDateTime(commission.depositReturnDueAt)} 後才能歸還。`
                                        : `尚未滿 ${COMMISSION_DEPOSIT_HOLD_DAYS} 天，暫時不能歸還。`}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                        {commission.reviewNote && (
                          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                              審核備註
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-200/75">
                              {commission.reviewNote}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3">
                          {commission.status === "open" && !commission.isCreator && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:flex-row md:items-end">
                              <label className="block flex-1 space-y-2">
                                <span className="text-sm font-medium text-white/85">
                                  你的執行抽成 %
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={80}
                                  value={executorFees[commission.id] ?? "0"}
                                  onChange={(event) =>
                                    setExecutorFees((current) => ({
                                      ...current,
                                      [commission.id]: event.target.value,
                                    }))
                                  }
                                  disabled={activeAction === `accept:${commission.id}`}
                                  className="w-full rounded-2xl border border-white/15 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                                />
                              </label>
                              <ActionButton
                                onClick={() => handleAccept(commission.id)}
                                disabled={activeAction === `accept:${commission.id}`}
                                variant="success"
                              >
                                {activeAction === `accept:${commission.id}`
                                  ? "承接中..."
                                  : "承接委託"}
                              </ActionButton>
                            </div>
                          )}

                          {commission.status === "awaiting_seller_confirmation" &&
                            commission.isCreator && (
                              <div className="flex flex-wrap gap-3">
                                <ActionButton
                                  onClick={() => handleSellerConfirmation(commission.id, true)}
                                  disabled={
                                    activeAction === `seller:${commission.id}:approve` ||
                                    activeAction === `seller:${commission.id}:reject`
                                  }
                                  variant="success"
                                >
                                  同意抽成並開始執行
                                </ActionButton>
                                <ActionButton
                                  onClick={() => handleSellerConfirmation(commission.id, false)}
                                  disabled={
                                    activeAction === `seller:${commission.id}:approve` ||
                                    activeAction === `seller:${commission.id}:reject`
                                  }
                                  variant="danger"
                                >
                                  拒絕抽成並重新開放
                                </ActionButton>
                              </div>
                            )}

                          {viewer.isAdmin &&
                            (commission.status === "pending_review" ||
                              commission.status === "queued" ||
                              commission.status === "open" ||
                              commission.status === "awaiting_seller_confirmation" ||
                              commission.status === "in_progress") && (
                              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                                <label className="block space-y-2">
                                  <span className="text-sm font-medium text-white/85">
                                    管理備註
                                  </span>
                                  <textarea
                                    rows={3}
                                    value={adminNotes[commission.id] ?? commission.reviewNote ?? ""}
                                    onChange={(event) =>
                                      setAdminNotes((current) => ({
                                        ...current,
                                        [commission.id]: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-white/15 bg-slate-950/50 px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/40"
                                    placeholder="可選填退件理由、補件要求或結案備註。"
                                  />
                                </label>
                                <div className="mt-4 flex flex-wrap gap-3">
                                  {(commission.status === "pending_review" ||
                                    commission.status === "queued") && (
                                    <>
                                      <ActionButton
                                        onClick={() =>
                                          handleAdminStatus(commission.id, "open")
                                        }
                                        disabled={
                                          activeAction === `admin:${commission.id}:open`
                                        }
                                        variant="success"
                                      >
                                        通過審核
                                      </ActionButton>
                                      <ActionButton
                                        onClick={() =>
                                          handleAdminStatus(commission.id, "rejected")
                                        }
                                        disabled={
                                          activeAction === `admin:${commission.id}:rejected`
                                        }
                                        variant="danger"
                                      >
                                        退回案件
                                      </ActionButton>
                                    </>
                                  )}

                                  {commission.status === "open" && (
                                    <ActionButton
                                      onClick={() =>
                                        handleAdminStatus(commission.id, "cancelled")
                                      }
                                      disabled={
                                        activeAction === `admin:${commission.id}:cancelled`
                                      }
                                      variant="danger"
                                    >
                                      取消案件
                                    </ActionButton>
                                  )}

                                  {(commission.status === "awaiting_seller_confirmation" ||
                                    commission.status === "in_progress") && (
                                    <>
                                      <ActionButton
                                        onClick={() =>
                                          handleAdminStatus(commission.id, "completed")
                                        }
                                        disabled={
                                          activeAction === `admin:${commission.id}:completed`
                                        }
                                        variant="success"
                                      >
                                        標記完成
                                      </ActionButton>
                                      <ActionButton
                                        onClick={() =>
                                          handleAdminStatus(commission.id, "cancelled")
                                        }
                                        disabled={
                                          activeAction === `admin:${commission.id}:cancelled`
                                        }
                                        variant="danger"
                                      >
                                        取消案件
                                      </ActionButton>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
