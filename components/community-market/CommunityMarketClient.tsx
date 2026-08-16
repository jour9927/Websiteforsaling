"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  twd,
  taipeiDate,
  type CommunityListing,
  type MarketInventoryItem,
} from "@/lib/community-market";

type Props = {
  active: CommunityListing[];
  recent: CommunityListing[];
  inventory: MarketInventoryItem[];
  currentUserId: string | null;
  identityStatus: "pending" | "approved" | "rejected" | null;
  unavailable: string | null;
};

function PokemonArtwork({ listing }: { listing: CommunityListing }) {
  const { pokemon } = listing;
  return (
    <div
      className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
      style={{ background: "var(--eg-bg-muted)" }}
    >
      {pokemon.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pokemon.image_url}
          alt={pokemon.pokemon_name}
          className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <span className="text-5xl" aria-hidden="true">◓</span>
      )}
      <div className="absolute left-3 top-3 flex gap-1.5">
        <span className="eg-tag">第 {pokemon.generation} 世代</span>
        {pokemon.is_shiny && <span className="eg-tag eg-tag--accent">色違</span>}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: CommunityListing }) {
  const current = listing.bid_count > 0 ? listing.current_price : listing.starting_price;
  const expired = listing.status === "active" && new Date(listing.end_time).getTime() <= Date.now();
  const statusLabel =
    listing.status === "sold"
      ? "已成交"
      : listing.status === "pending_payment"
        ? "待付款"
      : listing.status === "cancelled"
        ? "已取消"
        : listing.status === "ended"
          ? "流標"
          : expired
            ? "待結算"
            : "競標中";

  return (
    <Link
      href={`/community-market/${listing.id}` as Route}
      className="eg-card eg-card--interactive group flex h-full flex-col overflow-hidden"
    >
      <PokemonArtwork listing={listing} />
      <div className="relative z-[1] flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="eg-h3">{listing.pokemon.pokemon_name}</h3>
            {listing.pokemon.pokemon_name_en && (
              <p className="eg-meta mt-0.5">{listing.pokemon.pokemon_name_en}</p>
            )}
          </div>
          <span className={`eg-tag ${listing.status === "active" && !expired ? "eg-tag--success" : ""}`}>
            {listing.status === "active" && !expired && <span className="eg-dot eg-dot--live" />}
            {statusLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <p className="eg-meta">{listing.bid_count > 0 ? "目前最高" : "起標價"}</p>
            <p className="eg-num mt-1 text-xl font-semibold" style={{ color: "var(--eg-accent)" }}>
              {twd(current)}
            </p>
          </div>
          <div className="text-right">
            <p className="eg-meta">出價</p>
            <p className="eg-num mt-1 text-lg font-medium">{listing.bid_count} 次</p>
          </div>
        </div>

        <div className="mt-auto border-t pt-3" style={{ borderColor: "var(--eg-border)" }}>
          <div className="flex items-center justify-between gap-3 text-xs" style={{ color: "var(--eg-ink-3)" }}>
            <span className="truncate">賣家 · {listing.seller_name}</span>
            <span className="flex-none">
              {listing.status === "active" && !expired ? `至 ${taipeiDate(listing.end_time)}` : taipeiDate(listing.updated_at)}
            </span>
          </div>
          {listing.buy_now_price !== null && listing.status === "active" && !expired && (
            <p className="eg-meta mt-2">直購 {twd(listing.buy_now_price)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CommunityMarketClient({
  active,
  recent,
  inventory,
  currentUserId,
  identityStatus,
  unavailable,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState(inventory[0]?.id || "");

  const selected = useMemo(
    () => inventory.find((item) => item.id === selectedItem) || null,
    [inventory, selectedItem],
  );

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      user_distribution_id: selectedItem,
      starting_price: Number(form.get("starting_price")),
      min_increment: Number(form.get("min_increment")),
      buy_now_price: form.get("buy_now_price") ? Number(form.get("buy_now_price")) : null,
      duration_hours: Number(form.get("duration_hours")),
      description: String(form.get("description") || ""),
      payment_instructions: String(form.get("payment_instructions") || ""),
    };

    try {
      const response = await fetch("/api/community-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "刊登失敗");
      setMessage("刊登成功，已加入公開拍賣列表。");
      setShowForm(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "刊登失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="eg-card overflow-hidden p-6 md:p-8">
        <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eg-eyebrow">Community Market</p>
            <h1 className="eg-h1 mt-2">民間交易區</h1>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--eg-ink-2)" }}>
              從自己的收藏刊登配布寶可夢，以新台幣自由出價或直購；得標後由買家匯款，賣家確認收款才完成收藏交付。
            </p>
            <p className="eg-meta mt-2">最後 60 秒出現新最高價時，系統會自動延長 2 分鐘。</p>
            <p className="eg-meta mt-1">刊登、出價與直購皆須通過身分證正反面人工實名審核。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {currentUserId && identityStatus === "approved" ? (
              <button
                type="button"
                onClick={() => setShowForm((value) => !value)}
                className="eg-btn eg-btn--primary"
                disabled={Boolean(unavailable)}
              >
                {showForm ? "收起刊登表單" : "刊登寶可夢"}
              </button>
            ) : currentUserId ? (
              <Link href="/profile" className="eg-btn eg-btn--primary">
                {identityStatus === "pending" ? "等待實名審核" : "完成實名認證"}
              </Link>
            ) : (
              <Link href="/login?redirect=%2Fcommunity-market" className="eg-btn eg-btn--primary">
                登入並完成實名
              </Link>
            )}
          </div>
        </div>
      </header>

      {unavailable && (
        <div className="eg-card p-5" style={{ borderColor: "var(--eg-warn-border)" }}>
          <p className="text-sm" style={{ color: "var(--eg-warn)" }}>{unavailable}</p>
        </div>
      )}

      {currentUserId && identityStatus !== "approved" && (
        <div className="eg-card p-5" style={{ borderColor: "var(--eg-warn-border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--eg-warn)" }}>
            {identityStatus === "pending" ? "實名資料正在人工審核中" : "交易功能需要通過實名認證"}
          </p>
          <p className="eg-meta mt-1.5">
            你仍可瀏覽所有拍賣；通過身分證正反面人工審核後，才可刊登、出價或直購。
          </p>
          <Link href="/profile" className="eg-link mt-3 inline-block text-sm">前往我的帳號查看認證 →</Link>
        </div>
      )}

      {message && (
        <div className="eg-card p-4" role="status">
          <p className="text-sm" style={{ color: "var(--eg-ink-2)" }}>{message}</p>
        </div>
      )}

      {showForm && currentUserId && identityStatus === "approved" && (
        <section className="eg-card p-5 md:p-7">
          <div className="mb-6">
            <p className="eg-eyebrow">New Listing</p>
            <h2 className="eg-h2 mt-1.5">建立拍賣</h2>
          </div>
          {inventory.length === 0 ? (
            <div className="eg-card eg-card--subtle p-6 text-center">
              <p className="eg-h3">目前沒有可刊登的收藏</p>
              <p className="eg-meta mt-2">已上架的寶可夢會先鎖定；你也可以到配布圖鑑加入自己的收藏。</p>
              <Link href="/pokedex" className="eg-btn eg-btn--secondary eg-btn--sm mt-4">前往配布圖鑑</Link>
            </div>
          ) : (
            <form onSubmit={createListing} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">選擇你的寶可夢</span>
                  <select
                    className="eg-input"
                    value={selectedItem}
                    onChange={(event) => setSelectedItem(event.target.value)}
                    required
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.pokemon.pokemon_name} · 第 {item.pokemon.generation} 世代
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">起標價</span>
                    <input name="starting_price" type="number" min="1" max="100000000" defaultValue="100" className="eg-input" required />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">最低加價</span>
                    <input name="min_increment" type="number" min="1" max="100000000" defaultValue="10" className="eg-input" required />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">直購價（選填）</span>
                    <input name="buy_now_price" type="number" min="1" max="100000000" placeholder="例如 1000" className="eg-input" />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">拍賣時間</span>
                  <select name="duration_hours" defaultValue="72" className="eg-input">
                    <option value="1">1 小時</option>
                    <option value="3">3 小時</option>
                    <option value="6">6 小時</option>
                    <option value="12">12 小時</option>
                    <option value="24">1 天</option>
                    <option value="72">3 天</option>
                    <option value="168">7 天</option>
                    <option value="336">14 天</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">商品說明（選填）</span>
                  <textarea
                    name="description"
                    maxLength={500}
                    rows={4}
                    className="eg-input !h-auto py-2.5"
                    placeholder="補充來源、收藏故事或想告訴買家的資訊"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">得標後付款說明</span>
                  <textarea
                    name="payment_instructions"
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                    className="eg-input !h-auto py-2.5"
                    placeholder="例如：銀行代碼、帳號、戶名及匯款期限。只有得標買家、賣家與管理員能看到。"
                    required
                  />
                  <span className="eg-meta mt-1.5 block">這是私密資料，不會出現在公開拍賣列表。</span>
                </label>
              </div>

              <div className="eg-card eg-card--subtle flex flex-col overflow-hidden">
                {selected?.pokemon.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.pokemon.image_url} alt={selected.pokemon.pokemon_name} className="aspect-[4/3] w-full object-contain p-6" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-5xl">◓</div>
                )}
                <div className="border-t p-4" style={{ borderColor: "var(--eg-border)" }}>
                  <p className="eg-h3">{selected?.pokemon.pokemon_name || "選擇寶可夢"}</p>
                  <p className="eg-meta mt-1">刊登後會鎖定此收藏及附加證章，直到成交、流標或取消。</p>
                  <button type="submit" disabled={submitting || !selectedItem} className="eg-btn eg-btn--primary eg-btn--block mt-5">
                    {submitting ? "刊登中…" : "確認公開拍賣"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eg-eyebrow">Live Auctions</p>
            <h2 className="eg-h2 mt-1.5">正在拍賣</h2>
          </div>
          <span className="eg-tag eg-tag--success eg-num">{active.length} 件上架中</span>
        </div>
        {active.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="eg-card eg-card--subtle px-6 py-14 text-center">
            <p className="eg-h3">目前還沒有玩家刊登寶可夢</p>
            <p className="eg-meta mt-2">第一件民間拍賣，等你來上架。</p>
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-5">
            <p className="eg-eyebrow">Market Archive</p>
            <h2 className="eg-h2 mt-1.5">近期成交與結束</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </section>
      )}
    </div>
  );
}
