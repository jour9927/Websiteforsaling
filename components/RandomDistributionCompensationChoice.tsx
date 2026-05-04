"use client";

import { useMemo, useState } from "react";

type CompensationChoice = "blindbox_discount_500" | "shop_rebate_50" | "pokemon_choice_5";

type ChoiceOption = {
  id: CompensationChoice;
  label: string;
  title: string;
  description: string;
};

const OPTIONS: ChoiceOption[] = [
  {
    id: "blindbox_discount_500",
    label: "A",
    title: "500 元盲盒抵用券",
    description: "適用於後續盲盒消費折抵。",
  },
  {
    id: "shop_rebate_50",
    label: "B",
    title: "商店消費報銷券（50%）",
    description: "商店消費可申請整體 50% 報銷。",
  },
  {
    id: "pokemon_choice_5",
    label: "C",
    title: "寶可夢五選一",
    description: "可從指定補償清單中選擇 1 隻寶可夢。",
  },
];

export function RandomDistributionCompensationChoice({
  initialChoice,
}: {
  initialChoice: CompensationChoice | null;
}) {
  const [selectedChoice, setSelectedChoice] = useState<CompensationChoice | null>(initialChoice);
  const [submittingChoice, setSubmittingChoice] = useState<CompensationChoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = useMemo(
    () => OPTIONS.find((option) => option.id === selectedChoice) || null,
    [selectedChoice],
  );

  async function submitChoice(choice: CompensationChoice) {
    if (selectedChoice || submittingChoice) return;

    setError(null);
    setSubmittingChoice(choice);

    try {
      const response = await fetch("/api/anniversary-30th/compensation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "補償選擇送出失敗，請稍後再試。");
      }

      setSelectedChoice(payload.choice || choice);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "補償選擇送出失敗，請稍後再試。");
    } finally {
      setSubmittingChoice(null);
    }
  }

  return (
    <section className="rounded-lg border border-amber-200/25 bg-amber-200/[0.07] p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/70">
            補償選擇
          </p>
          <h2 className="mt-2 text-xl font-black text-white">對戰積分重整補償</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            受影響帳號可在下方三選一。選擇送出後會直接發放到背包，且無法重複領取。
          </p>
        </div>
        {selectedOption ? (
          <span className="rounded border border-emerald-300/25 px-3 py-1.5 text-xs font-black text-emerald-100">
            已選 {selectedOption.label}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {OPTIONS.map((option) => {
          const isSelected = selectedChoice === option.id;
          const isSubmitting = submittingChoice === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={Boolean(selectedChoice) || Boolean(submittingChoice)}
              onClick={() => submitChoice(option.id)}
              className={`rounded border p-4 text-left transition ${
                isSelected
                  ? "border-emerald-300/45 bg-emerald-300/10"
                  : "border-white/12 bg-black/30 hover:border-amber-200/35 hover:bg-white/[0.04]"
              } ${selectedChoice || submittingChoice ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-white/10 font-mono text-sm font-black text-white">
                {option.label}
              </span>
              <span className="ml-3 text-base font-black text-white">{option.title}</span>
              <p className="mt-3 text-sm leading-6 text-white/58">
                {isSubmitting ? "發放中..." : option.description}
              </p>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 rounded border border-red-300/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </section>
  );
}
