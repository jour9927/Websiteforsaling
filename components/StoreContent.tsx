"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/lib/cart";

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  is_active: boolean;
}

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

export default function StoreContent() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ShopProduct | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetch("/api/admin/store")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data.filter((p: ShopProduct) => p.is_active));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return [...cats].sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-white/50 animate-pulse">載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 商店標題 */}
      <section className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🏪 道具商店
            </h1>
            <p className="text-white/60 mt-1">
              選購各種實用道具與收藏品，豐富你的冒險旅程！
            </p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {filtered.length}
            </p>
            <p className="text-[10px] text-white/40">件商品</p>
          </div>
        </div>
      </section>

      {/* 篩選列 */}
      <section className="glass-card p-4 space-y-3">
        <input
          type="text"
          placeholder="搜尋商品名稱、描述..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCategory === null
                ? "bg-white text-slate-900"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            全部分類
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-amber-500 text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 商品列表 */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/50 text-lg">目前沒有商品</p>
          <p className="text-white/30 text-sm mt-2">敬請期待新商品上架！</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedItem(product)}
              className="glass-card overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-white/10"
            >
              <div className="p-5 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                {/* 商品圖片 */}
                <div className="w-full h-40 rounded-xl bg-white/5 flex items-center justify-center mb-4 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-4xl opacity-30">🏪</span>
                  )}
                </div>

                {/* 商品資訊 */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-semibold text-lg leading-tight">
                      {product.name}
                    </h3>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/60">
                      {product.category}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-white/50 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* 庫存 + 價格 */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <div>
                      {product.stock === -1 ? (
                        <span className="text-xs text-emerald-400/80">無限庫存</span>
                      ) : product.stock > 0 ? (
                        <span className="text-xs text-white/50">
                          庫存 {product.stock}
                        </span>
                      ) : (
                        <span className="text-xs text-red-400/80">已售罄</span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-amber-400">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  {/* 加入購物車 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        stock: product.stock,
                      });
                    }}
                    disabled={product.stock === 0}
                    className="mt-3 w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-black hover:bg-amber-400 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {product.stock === 0 ? "已售罄" : "🛒 加入購物車"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 商品詳情 Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition"
            >
              ✕
            </button>

            {/* 圖片 */}
            <div className="w-full h-48 rounded-xl bg-white/5 flex items-center justify-center mb-6 overflow-hidden">
              {selectedItem.image_url ? (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-6xl opacity-30">🏪</span>
              )}
            </div>

            {/* 資訊 */}
            <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-white/10 text-white/60">
              {selectedItem.category}
            </span>

            {selectedItem.description && (
              <p className="text-white/70 text-sm mt-4 leading-relaxed">
                {selectedItem.description}
              </p>
            )}

            <div className="space-y-2 mt-6 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">價格</span>
                <span className="text-amber-400 font-bold text-lg">
                  {formatPrice(selectedItem.price)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">庫存</span>
                <span className="text-white">
                  {selectedItem.stock === -1
                    ? "無限"
                    : selectedItem.stock > 0
                    ? `${selectedItem.stock} 件`
                    : "已售罄"}
                </span>
              </div>
            </div>

            {/* 加入購物車 */}
            <button
              onClick={() => {
                addItem({
                  productId: selectedItem.id,
                  name: selectedItem.name,
                  price: selectedItem.price,
                  image_url: selectedItem.image_url,
                  stock: selectedItem.stock,
                });
                setSelectedItem(null);
              }}
              disabled={selectedItem.stock === 0}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedItem.stock === 0 ? "已售罄" : "🛒 加入購物車"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
