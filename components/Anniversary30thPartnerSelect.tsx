"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PARTNER_POKEMON_POOL,
  getPokemonSpriteUrl,
  type PartnerPokemonId,
} from "@/lib/anniversary30th";

export function Anniversary30thPartnerSelect() {
  const router = useRouter();
  const [selected, setSelected] = useState<PartnerPokemonId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/anniversary-30th/partner/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "選擇失敗");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "選擇失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="anniversary-stage relative overflow-hidden rounded-[28px] border border-amber-400/30 bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.15),transparent_40%),linear-gradient(165deg,#0d111f,#171126_50%,#0f2330)] p-6 md:p-8">
      <div className="pointer-events-none absolute -left-10 top-6 h-36 w-36 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 bottom-6 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl" />

      <div className="relative">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
          Step 1
        </p>
        <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
          選擇你的攜帶伴侶
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">
          選一隻寶可夢作為你在 30 週年對決中的攜帶伴侶。牠會與你並肩作戰七天，一起迎戰每日對決！
          <br />
          <span className="text-amber-200/80">⚠ 選定後無法更換，請謹慎選擇。</span>
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PARTNER_POKEMON_POOL.map((poke) => {
            const isSelected = selected === poke.id;
            return (
              <button
                key={poke.id}
                type="button"
                onClick={() => setSelected(poke.id)}
                className={`group relative flex flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
                  isSelected
                    ? "border-amber-400/60 bg-amber-500/15 shadow-[0_0_24px_rgba(251,191,36,0.2)] scale-[1.04]"
                    : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/5"
                }`}
              >
                <div
                  className={`relative h-20 w-20 transition-transform duration-300 ${
                    isSelected ? "scale-110" : "group-hover:scale-105"
                  }`}
                >
                  <img
                    src={getPokemonSpriteUrl(poke.sprite)}
                    alt={poke.name}
                    className="h-full w-full object-contain drop-shadow-lg"
                  />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-black shadow">
                      ✓
                    </div>
                  )}
                </div>
                <p
                  className={`mt-3 text-sm font-semibold transition-colors ${
                    isSelected ? "text-amber-200" : "text-white/80"
                  }`}
                >
                  {poke.name}
                </p>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-rose-300">{error}</p>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || submitting}
          className="mt-8 w-full rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[280px]"
        >
          {submitting
            ? "確認中..."
            : selected
              ? `確認選擇 ${PARTNER_POKEMON_POOL.find((p) => p.id === selected)?.name}`
              : "請先選擇一隻寶可夢"}
        </button>
      </div>
    </section>
  );
}
