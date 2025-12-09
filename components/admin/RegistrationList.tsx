"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditRegistrationTimeModal from "@/components/admin/EditRegistrationTimeModal";
import { getStatusLabel } from "@/lib/statusLabels";

type Registration = {
  id: string;
  status: string;
  registered_at: string;
  user_id: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
};

type RegistrationListProps = {
  registrations: Registration[];
};

export default function RegistrationList({ registrations }: RegistrationListProps) {
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const router = useRouter();

  const handleEditSuccess = () => {
    setEditingRegistration(null);
    router.refresh();
  };

  return (
    <>
      {registrations.length === 0 ? (
        <div className="mt-4 text-center text-sm text-white/50">
          尚無報名記錄
        </div>
      ) : (
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">
                  {reg.profile?.full_name || reg.profile?.email || "未知會員"}
                </p>
                <p className="text-xs text-white/50">
                  {reg.profile?.email}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {new Date(reg.registered_at).toLocaleString("zh-TW")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    reg.status === "confirmed"
                      ? "bg-green-500/20 text-green-200"
                      : reg.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-200"
                      : "bg-gray-500/20 text-gray-200"
                  }`}
                >
                  {getStatusLabel(reg.status)}
                </span>
                <button
                  onClick={() => setEditingRegistration(reg)}
                  className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
                  title="修改報名時間"
                >
                  ⏰
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingRegistration && (
        <EditRegistrationTimeModal
          registrationId={editingRegistration.id}
          currentTime={editingRegistration.registered_at}
          userName={editingRegistration.profile?.full_name || editingRegistration.profile?.email || "未知會員"}
          onClose={() => setEditingRegistration(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
