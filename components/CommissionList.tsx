"use client";

import Link from "next/link";
import type { Route } from "next";

interface Commission {
  id: string;
  pokemon_name: string;
  description: string;
  base_price: number;
  price_type: string;
  platform_fee: number;
  executor_fee: number;
  status: string;
  queue_position: number | null;
  created_at: string;
  distributions: {
    pokemon_name: string;
    pokemon_name_en: string | null;
    pokemon_sprite_url: string | null;
    generation: number;
    points: number | null;
  } | null;
  poster: { id: string; display_name: string } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "開放中", color: "bg-green-500/20 text-green-400" },
  queued: { label: "排隊中", color: "bg-yellow-500/20 text-yellow-400" },
  accepted: { label: "已接單", color: "bg-blue-500/20 text-blue-400" },
  proof_submitted: { label: "證明審核中", color: "bg-purple-500/20 text-purple-400" },
  proof_approved: { label: "證明已通過", color: "bg-indigo-500/20 text-indigo-400" },
  completed: { label: "已完成", color: "bg-gray-500/20 text-gray-400" },
  cancelled: { label: "已取消", color: "bg-red-500/20 text-red-400" },
};

export default function CommissionList({ commissions }: { commissions: Commission[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {commissions.map((c) => {
        const posterName = c.poster?.display_name || "匿名";
        const statusInfo = statusLabels[c.status] || { label: c.status, color: "bg-white/10 text-white/60" };

        return (
          <Link
            key={c.id}
            href={`/commissions/${c.id}` as Route}
            className="glass-card group flex flex-col gap-3 p-5 transition hover:border-indigo-500/30 hover:bg-white/5"
          >
            {/* 頂部：寶可夢 + 狀態 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {c.distributions?.pokemon_sprite_url ? (
                  <img
                    src={c.distributions.pokemon_sprite_url}
                    alt={c.pokemon_name}
                    className="h-12 w-12 rounded-lg bg-white/5 object-contain p-1"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-lg">
                    🎴
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white/90 group-hover:text-indigo-300">
                    {c.pokemon_name}
                  </h3>
                  {c.distributions?.pokemon_name_en && (
                    <p className="text-xs text-white/40">{c.distributions.pokemon_name_en}</p>
                  )}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
                {c.status === "queued" && c.queue_position && ` #${c.queue_position}`}
              </span>
            </div>

            {/* 說明 */}
            {c.description && (
              <p className="line-clamp-2 text-xs text-white/50">{c.description}</p>
            )}

            {/* 底部：價格 + 刊登者 */}
            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-amber-400 font-semibold">
                  💰 {c.price_type === "twd" ? `NT$${c.base_price.toLocaleString()}` : `${c.base_price.toLocaleString()} pts`}
                </span>
                {c.platform_fee > 0 && (
                  <span className="text-white/40">
                    執行者可抽成{" "}
                    <span className="inline-block font-bold text-green-400 glow-green">
                      {c.price_type === "twd" ? `NT$${c.platform_fee.toLocaleString()}` : `${c.platform_fee.toLocaleString()} pts`}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <span>{posterName}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleDateString("zh-TW")}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
