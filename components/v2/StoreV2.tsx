"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "@/lib/cart";
import { SectionHead, EmptyState } from "@/components/v2/primitives";

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  sold_count: number;
  is_active: boolean;
  seller_name: string | null;
  interested_count: number;
  liked_count: number;
}

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

/** 描述支援 ~~刪除線~~ */
function renderLine(line: string) {
  return line.split(/(~~.+?~~)/g).map((part, i) =>
    part.startsWith("~~") && part.endsWith("~~") ? (
      <span key={i} className="line-through" style={{ color: "var(--eg-ink-4)" }}>
        {part.slice(2, -2)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Description({ text }: { text: string }) {
  return (
    <div className="eg-body mt-4 flex flex-col gap-1.5 text-[13.5px]">
      {text.split("\n").map((line, i) =>
        line.trim() ? <p key={i}>{renderLine(line)}</p> : <div key={i} className="h-2" aria-hidden />,
      )}
    </div>
  );
}

function ProductThumb({ src, alt, size }: { src?: string; alt: string; size: "card" | "modal" }) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: size === "card" ? "var(--eg-r)" : "var(--eg-r-lg)",
        background: "var(--eg-bg-muted)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="flex h-full items-center justify-center"
          style={{ color: "var(--eg-ink-4)" }}
          aria-hidden="true"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9h18l-1.5 11H4.5L3 9Z" />
            <path d="M8 9V6a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
      )}
    </div>
  );
}

function StockLine({ stock, soldCount }: { stock: number; soldCount: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eg-meta eg-num">已售出 {soldCount || 0}</span>
      {stock === -1 ? (
        <span className="eg-meta" style={{ color: "var(--eg-success)" }}>
          剩餘 無限
        </span>
      ) : stock > 0 ? (
        <span className="eg-meta eg-num">剩餘 {stock}</span>
      ) : (
        <span className="eg-meta" style={{ color: "var(--eg-danger)" }}>
          已售罄
        </span>
      )}
    </div>
  );
}

function ProductCard({
  product,
  soldOut,
  onOpen,
  onAdd,
}: {
  product: ShopProduct;
  soldOut: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="eg-card eg-card--interactive flex flex-col p-4"
      style={soldOut ? { opacity: 0.66 } : undefined}
    >
      <div className="relative">
        <ProductThumb src={product.image_url} alt={product.name} size="card" />
        {soldOut && (
          <span
            className="eg-tag eg-tag--solid absolute left-1/2 top-1/2"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            已售罄
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-2">
        <h3 className="eg-h3 leading-snug">{product.name}</h3>
        <span className="eg-tag flex-none">{product.category}</span>
      </div>

      {product.description && (
        <p className="eg-body mt-1.5 line-clamp-2 text-[13px]">{product.description}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {product.seller_name && <span className="eg-meta">{product.seller_name}</span>}
        {product.interested_count > 0 && (
          <span className="eg-meta eg-num">{product.interested_count} 人感興趣</span>
        )}
        {product.liked_count > 0 && <span className="eg-meta eg-num">♥ {product.liked_count}</span>}
      </div>

      <div
        className="mt-auto flex items-end justify-between pt-3.5"
        style={{ borderTop: "1px solid var(--eg-border)", marginTop: "14px" }}
      >
        <StockLine stock={product.stock} soldCount={product.sold_count} />
        <span
          className="eg-num text-[17px] font-semibold"
          style={{ color: "var(--eg-ink)" }}
        >
          {formatPrice(product.price)}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        disabled={soldOut}
        className={`eg-btn eg-btn--block eg-btn--sm mt-3 ${soldOut ? "eg-btn--secondary" : "eg-btn--primary"}`}
      >
        {soldOut ? "已售罄" : "加入購物車"}
      </button>
    </article>
  );
}

export default function StoreV2() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    // 維持與 v1 相同的資料來源與過濾條件
    fetch("/api/admin/store")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data.filter((p: ShopProduct) => p.is_active));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 詳情開著時鎖背景捲動 + Esc 關閉
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  const available = useMemo(() => filtered.filter((p) => p.stock !== 0), [filtered]);
  const soldOut = useMemo(() => filtered.filter((p) => p.stock === 0), [filtered]);

  const add = useCallback(
    (p: ShopProduct) =>
      addItem({
        productId: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        stock: p.stock,
      }),
    [addItem],
  );

  return (
    <div className="flex flex-col gap-10">
      {/* 標題 */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eg-eyebrow">Store</p>
          <h1 className="eg-h1 mt-3">道具商店</h1>
          <p className="eg-lead mt-3 max-w-lg">
            選購各種實用道具與收藏品，豐富你的冒險旅程。
          </p>
        </div>
        <p className="eg-meta eg-num">
          {loading ? "載入中…" : `${filtered.length} 件商品`}
        </p>
      </header>

      {/* 工具列 */}
      <div className="flex flex-col gap-3">
        <input
          type="search"
          className="eg-input max-w-md"
          placeholder="搜尋商品名稱、描述…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="搜尋商品"
        />
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="eg-filter"
              aria-pressed={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            >
              全部分類
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className="eg-filter"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 內容 */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="eg-card p-4">
              <div className="eg-skeleton w-full" style={{ aspectRatio: "1 / 1" }} />
              <div className="eg-skeleton mt-3.5 h-4 w-2/3" />
              <div className="eg-skeleton mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery || selectedCategory ? "找不到符合的商品" : "目前沒有商品"}
          hint={searchQuery || selectedCategory ? "換個關鍵字或分類試試" : "敬請期待新商品上架"}
        />
      ) : (
        <>
          {available.length > 0 && (
            <section>
              {soldOut.length > 0 && <SectionHead title="可購買" count={`${available.length} 件`} />}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    soldOut={false}
                    onOpen={() => setSelected(p)}
                    onAdd={() => add(p)}
                  />
                ))}
              </div>
            </section>
          )}

          {soldOut.length > 0 && (
            <section>
              <SectionHead title="已售罄" count={`${soldOut.length} 件`} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {soldOut.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    soldOut
                    onOpen={() => setSelected(p)}
                    onAdd={() => add(p)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 詳情 */}
      {selected && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{ background: "rgba(24, 24, 27, 0.4)", backdropFilter: "blur(3px)" }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
        >
          <div
            className="eg-card relative max-h-[92vh] w-full max-w-lg overflow-y-auto p-6"
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

            <ProductThumb src={selected.image_url} alt={selected.name} size="modal" />

            <h2 className="eg-h2 mt-5">{selected.name}</h2>
            <span className="eg-tag mt-2.5">{selected.category}</span>

            {selected.description && <Description text={selected.description} />}

            <dl className="mt-6 flex flex-col">
              {[
                ["價格", formatPrice(selected.price)],
                ["已售出", `${selected.sold_count || 0} 件`],
                [
                  "剩餘",
                  selected.stock === -1
                    ? "無限"
                    : selected.stock > 0
                      ? `${selected.stock} 件`
                      : "已售罄",
                ],
                ...(selected.seller_name ? [["刊登者", selected.seller_name] as const] : []),
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: "1px solid var(--eg-border)" }}
                >
                  <dt className="eg-meta">{label}</dt>
                  <dd
                    className="eg-num text-[14px] font-medium"
                    style={{ color: "var(--eg-ink)" }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {(selected.interested_count > 0 || selected.liked_count > 0) && (
              <div className="mt-3 flex items-center gap-4">
                {selected.interested_count > 0 && (
                  <span className="eg-meta eg-num">{selected.interested_count} 人感興趣</span>
                )}
                {selected.liked_count > 0 && (
                  <span className="eg-meta eg-num">♥ {selected.liked_count}</span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                add(selected);
                setSelected(null);
              }}
              disabled={selected.stock === 0}
              className="eg-btn eg-btn--primary eg-btn--block eg-btn--lg mt-6"
            >
              {selected.stock === 0 ? "已售罄" : "加入購物車"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
