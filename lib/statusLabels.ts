export const STATUS_LABELS: Record<string, string> = {
  confirmed: "已確認",
  pending: "待確認",
  cancelled: "已取消",
};

export function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}
