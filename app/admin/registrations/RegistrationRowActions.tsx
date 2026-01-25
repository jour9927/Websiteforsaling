"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStatusLabel } from "@/lib/statusLabels";

type RegistrationRowActionsProps = {
  registrationId: string;
  currentStatus: string;
};

type ActionState = "confirm" | "cancel";

export default function RegistrationRowActions({
  registrationId,
  currentStatus,
}: RegistrationRowActionsProps) {
  const [loadingAction, setLoadingAction] = useState<ActionState | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isPending = currentStatus === "pending";

  const submitStatus = async (
    status: "confirmed" | "cancelled",
    action: ActionState,
    successMessage: string
  ) => {
    setLoadingAction(action);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "更新狀態失敗");
      }

      setFeedback(successMessage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法更新狀態");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = () =>
    submitStatus("confirmed", "confirm", "已批准此報名，參與紀錄將同步更新。");
  const handleReject = () =>
    submitStatus("cancelled", "cancel", "已拒絕此報名，會員將收到取消通知。");

  if (!isPending) {
    return (
      <p className="text-[11px] text-white/40">只有待確認的報名可進行審核</p>
    );
  }

  return (
    <div className="space-y-1 text-[11px]">
      <p className="text-white/50">狀態: {getStatusLabel(currentStatus)}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={loadingAction === "confirm"}
          className="inline-flex items-center rounded-xl bg-emerald-500/80 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "confirm" ? "批准中…" : "批准"}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={loadingAction === "cancel"}
          className="inline-flex items-center rounded-xl bg-rose-500/80 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "cancel" ? "取消中…" : "拒絕"}
        </button>
      </div>
      {feedback && <p className="text-emerald-300">{feedback}</p>}
      {error && <p className="text-rose-300">{error}</p>}
    </div>
  );
}
