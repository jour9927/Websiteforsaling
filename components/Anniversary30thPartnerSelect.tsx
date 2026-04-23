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

  const selectedPokemon = PARTNER_POKEMON_POOL.find((pokemon) => pokemon.id === selected);

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-black/30 p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/75">
        Step 2
      </p>
      <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
        選擇出場寶可夢
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
        已預先報名者需先選一隻寶可夢才能進入活動。戰鬥中會以「你的稱呼＋寶可夢名」出場，例如 kavin的伊布。選定後不可更換。
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PARTNER_POKEMON_POOL.map((pokemon) => {
          const isSelected = selected === pokemon.id;
          return (
            <button
              key={pokemon.id}
              type="button"
              onClick={() => setSelected(pokemon.id)}
              className={`group flex min-h-[138px] flex-col items-center justify-between rounded-lg border p-4 transition ${
                isSelected
                  ? "border-emerald-300 bg-emerald-300/12 text-emerald-100"
                  : "border-white/12 bg-black/25 text-white/75 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <img
                src={getPokemonSpriteUrl(pokemon.sprite)}
                alt={pokemon.name}
                className="h-20 w-20 object-contain transition group-hover:scale-105"
              />
              <span className="mt-3 text-sm font-bold">{pokemon.name}</span>
              <span className="mt-2 h-5 text-xs text-emerald-200">
                {isSelected ? "已選擇" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || submitting}
        className="mt-7 w-full rounded bg-emerald-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[260px]"
      >
        {submitting
          ? "確認中..."
          : selectedPokemon
            ? `確認並進入活動：${selectedPokemon.name}`
            : "請先選擇一隻寶可夢"}
      </button>
    </section>
  );
}
