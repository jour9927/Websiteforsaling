"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStatusLabel } from "@/lib/statusLabels";

type ApprovalControlsProps = {
  registrationId: string;
  currentStatus: string;
};

type ActionState = "confirm" | "cancel";

export default function ApprovalControls({ registrationId, currentStatus }: ApprovalControlsProps) {
  const [loadingAction, setLoadingAction] = useState<ActionState | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isPending = currentStatus === "pending";

  const submitStatus = async (status: "confirmed" | "cancelled", action: ActionState, successMessage: string) => {
    setLoadingAction(action);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
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

  const handleDeny = () =>
    submitStatus("cancelled", "cancel", "已拒絕此報名，會員將收到取消通知。");

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        當前狀態：<span className="font-semibold">{getStatusLabel(currentStatus)}</span>
      </p>
      <p className="text-xs text-white/50">
        只有「待確認」的報名才可進行審核。確認後該活動才會出現在會員的參與紀錄中。
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={!isPending || loadingAction === "confirm"}
          className="inline-flex items-center rounded-xl bg-green-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "confirm" ? "批准中..." : "批准報名"}
        </button>
        <button
          type="button"
          onClick={handleDeny}
          disabled={!isPending || loadingAction === "cancel"}
          className="inline-flex items-center rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "cancel" ? "取消中..." : "拒絕報名"}
        </button>
      </div>

      {feedback && (
        <p className="text-xs text-emerald-300">{feedback}</p>
      )}
      {error && (
        <p className="text-xs text-rose-300">{error}</p>
      )}
    </div>
  );
}
