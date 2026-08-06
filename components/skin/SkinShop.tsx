"use client";

import { useState, useMemo, useEffect } from "react";
import { SectionHead, EmptyState, StatTile } from "@/components/skin/primitives";

interface Distribution {
  id: string;
  pokemon_name: string;
  pokemon_name_en?: string;
  pokemon_sprite_url?: string;
  event_name?: string;
  generation: number;
  game_titles?: string[];
  level?: number;
  region?: string;
  is_shiny?: boolean;
  special_move?: string;
  original_trainer?: string;
  distribution_method?: string;
  points?: number;
}

interface Props {
  distributions: Distribution[];
  userCollected: string[];
  isLoggedIn: boolean;
}

type SortOption = "price-desc" | "price-asc" | "gen-desc" | "name";

/* 稀有度門檻沿用 v1，但配色改成白底讀得到的深階。
   v1 用的是為深色底挑的淡色（text-red-300 等），疊白底會糊。 */
const TIERS = [
  { min: 900000, label: "傳說", color: "#b91c1c", tint: "rgba(185,28,28,0.08)" },
  { min: 350000, label: "史詩", color: "#b45309", tint: "rgba(180,83,9,0.08)" },
  { min: 120000, label: "稀有", color: "#7e22ce", tint: "rgba(126,34,206,0.08)" },
  { min: 50000, label: "精良", color: "#1d4ed8", tint: "rgba(29,78,216,0.08)" },
  { min: 10000, label: "優質", color: "#15803d", tint: "rgba(21,128,61,0.08)" },
  { min: 0, label: "普通", color: "#52525b", tint: "transparent" },
];

const tierOf = (points: number) => TIERS.find((t) => points >= t.min) ?? TIERS[TIERS.length - 1];

const PAGE_SIZE = 48;

const SORTS: { key: SortOption; label: string }[] = [
  { key: "price-desc", label: "點數高→低" },
  { key: "price-asc", label: "點數低→高" },
  { key: "gen-desc", label: "世代新→舊" },
  { key: "name", label: "名稱" },
];

function DistCard({
  dist,
  owned,
  onOpen,
}: {
  dist: Distribution;
  owned: boolean;
  onOpen: () => void;
}) {
  const tier = tierOf(dist.points || 0);
  return (
    <article onClick={onOpen} className="eg-card eg-card--interactive flex flex-col p-3.5">
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          aspectRatio: "4 / 3",
          borderRadius: "var(--eg-r)",
          background: tier.tint === "transparent" ? "var(--eg-bg-muted)" : tier.tint,
        }}
      >
        {dist.pokemon_sprite_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dist.pokemon_sprite_url}
            alt=""
            className="h-full w-full object-contain p-3"
            loading="lazy"
          />
        ) : (
          <span className="eg-meta">無圖</span>
        )}
        <span
          className="eg-tag absolute left-2 top-2"
          style={{ borderColor: tier.color, color: tier.color, background: "var(--eg-bg)" }}
        >
          {tier.label}
        </span>
        {owned && (
          <span className="eg-tag eg-tag--success absolute right-2 top-2">已擁有</span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="eg-h3 truncate">{dist.pokemon_name}</h3>
        {dist.is_shiny && (
          <span className="eg-tag eg-tag--warn flex-none" title="色違">
            ✦
          </span>
        )}
      </div>
      {dist.event_name && <p className="eg-meta mt-0.5 truncate">{dist.event_name}</p>}

      <div
        className="mt-auto flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--eg-border)", marginTop: 12 }}
      >
        <span className="eg-meta eg-num">第 {dist.generation} 世代</span>
        <span className="eg-num text-[15px] font-semibold" style={{ color: "var(--eg-ink)" }}>
          {(dist.points || 0).toLocaleString()}
        </span>
      </div>
    </article>
  );
}

export default function SkinShop({ distributions, userCollected, isLoggedIn }: Props) {
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("price-desc");
  const [hideOwned, setHideOwned] = useState(false);
  const [selected, setSelected] = useState<Distribution | null>(null);
  const [page, setPage] = useState(1);

  const gens = useMemo(
    () => [...new Set(distributions.map((d) => d.generation))].sort((a, b) => b - a),
    [distributions],
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = distributions.filter((d) => {
      if (selectedGen && d.generation !== selectedGen) return false;
      if (selectedTier && tierOf(d.points || 0).label !== selectedTier) return false;
      if (hideOwned && userCollected.includes(d.id)) return false;
      if (!kw) return true;
      return (
        d.pokemon_name.toLowerCase().includes(kw) ||
        (d.pokemon_name_en || "").toLowerCase().includes(kw) ||
        (d.event_name || "").toLowerCase().includes(kw)
      );
    });
    const sorted = [...out];
    if (sortBy === "price-desc") sorted.sort((a, b) => (b.points || 0) - (a.points || 0));
    else if (sortBy === "price-asc") sorted.sort((a, b) => (a.points || 0) - (b.points || 0));
    else if (sortBy === "gen-desc") sorted.sort((a, b) => b.generation - a.generation);
    else sorted.sort((a, b) => a.pokemon_name.localeCompare(b.pokemon_name, "zh-Hant"));
    return sorted;
  }, [distributions, selectedGen, selectedTier, hideOwned, q, sortBy, userCollected]);

  // 條件一變就回到第一頁，不然會停在一個空白的分頁
  useEffect(() => {
    setPage(1);
  }, [selectedGen, selectedTier, hideOwned, q, sortBy]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col items-start gap-4">
        <p className="eg-eyebrow">Distribution Shop</p>
        <h1 className="eg-h1">配布商店</h1>
        <p className="eg-lead max-w-xl">
          瀏覽全部收錄的配布寶可夢，依世代、稀有度與點數尋找你要的那一隻。
        </p>
      </header>

      <div className={`grid gap-4 ${isLoggedIn ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <StatTile label="收錄配布" value={distributions.length.toLocaleString()} hint="有點數的品項" />
        <StatTile label="符合目前條件" value={filtered.length.toLocaleString()} hint={`共 ${totalPages} 頁`} />
        {isLoggedIn && (
          <StatTile label="我已擁有" value={userCollected.length.toLocaleString()} hint="會標記在卡片上" />
        )}
      </div>

      {/* 工具列 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            className="eg-input max-w-md"
            placeholder="搜尋寶可夢、英文名、活動名稱…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="搜尋配布"
          />
          <select
            className="eg-input"
            style={{ width: "auto", minWidth: 140 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="排序方式"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {isLoggedIn && (
            <button
              type="button"
              className="eg-filter"
              aria-pressed={hideOwned}
              onClick={() => setHideOwned((v) => !v)}
            >
              隱藏已擁有
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="eg-filter"
            aria-pressed={selectedTier === null}
            onClick={() => setSelectedTier(null)}
          >
            全部稀有度
          </button>
          {TIERS.map((t) => (
            <button
              key={t.label}
              type="button"
              className="eg-filter"
              aria-pressed={selectedTier === t.label}
              onClick={() => setSelectedTier(selectedTier === t.label ? null : t.label)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="eg-filter"
            aria-pressed={selectedGen === null}
            onClick={() => setSelectedGen(null)}
          >
            全世代
          </button>
          {gens.map((g) => (
            <button
              key={g}
              type="button"
              className="eg-filter"
              aria-pressed={selectedGen === g}
              onClick={() => setSelectedGen(selectedGen === g ? null : g)}
            >
              第 {g} 世代
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="找不到符合的配布" hint="換個關鍵字、世代或稀有度試試" />
      ) : (
        <section>
          <SectionHead
            title="配布清單"
            count={`顯示 ${shown.length} / ${filtered.length.toLocaleString()}`}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((d) => (
              <DistCard
                key={d.id}
                dist={d}
                owned={userCollected.includes(d.id)}
                onOpen={() => setSelected(d)}
              />
            ))}
          </div>

          {/* 分頁：v1 把 696 件一次全渲染，頁面高達 52,000px */}
          {shown.length < filtered.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="eg-btn eg-btn--secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                載入更多（還有 {(filtered.length - shown.length).toLocaleString()} 件）
              </button>
            </div>
          )}
        </section>
      )}

      {/* 詳情 */}
      {selected && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{ background: "var(--eg-scrim)", backdropFilter: "blur(3px)" }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.pokemon_name}
        >
          <div
            className="eg-card relative max-h-[92vh] w-full max-w-md overflow-y-auto p-6"
            style={{ boxShadow: "var(--eg-shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="eg-btn eg-btn--ghost eg-btn--sm absolute right-4 top-4"
              style={{ width: 32, paddingInline: 0 }}
              aria-label="關閉"
            >
              ✕
            </button>

            <div
              className="flex items-center justify-center"
              style={{
                aspectRatio: "4 / 3",
                borderRadius: "var(--eg-r-lg)",
                background: tierOf(selected.points || 0).tint || "var(--eg-bg-muted)",
              }}
            >
              {selected.pokemon_sprite_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.pokemon_sprite_url}
                  alt=""
                  className="h-full w-full object-contain p-6"
                />
              )}
            </div>

            <h2 className="eg-h2 mt-5">{selected.pokemon_name}</h2>
            {selected.pokemon_name_en && <p className="eg-meta mt-1">{selected.pokemon_name_en}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="eg-tag"
                style={{ borderColor: tierOf(selected.points || 0).color, color: tierOf(selected.points || 0).color }}
              >
                {tierOf(selected.points || 0).label}
              </span>
              <span className="eg-tag">第 {selected.generation} 世代</span>
              {selected.is_shiny && <span className="eg-tag eg-tag--warn">色違</span>}
              {userCollected.includes(selected.id) && (
                <span className="eg-tag eg-tag--success">已擁有</span>
              )}
            </div>

            <dl className="mt-5 flex flex-col">
              {(
                [
                  ["點數", (selected.points || 0).toLocaleString()],
                  ["活動", selected.event_name],
                  ["對應遊戲", selected.game_titles?.join("、")],
                  ["等級", selected.level ? `Lv.${selected.level}` : undefined],
                  ["地區", selected.region],
                  ["原訓練家", selected.original_trainer],
                  ["特殊招式", selected.special_move],
                  ["配布方式", selected.distribution_method],
                ] as [string, string | undefined][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-4 py-2.5"
                    style={{ borderBottom: "1px solid var(--eg-border)" }}
                  >
                    <dt className="eg-meta flex-none">{k}</dt>
                    <dd
                      className="eg-num text-right text-[14px] font-medium"
                      style={{ color: "var(--eg-ink)" }}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
