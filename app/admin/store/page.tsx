"use client";

import { useState, useEffect, useCallback } from "react";

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

const CATEGORIES = ["一般", "道具", "收藏品", "服飾", "票券", "特殊"];

export default function AdminStorePage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 表單 state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    category: "一般",
    stock: -1,
    is_active: true,
  });

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/admin/store");
    const data = await res.json();
    if (Array.isArray(data)) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function resetForm() {
    setForm({
      name: "",
      description: "",
      price: 0,
      image_url: "",
      category: "一般",
      stock: -1,
      is_active: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  }

  function startEdit(product: ShopProduct) {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      stock: product.stock,
      is_active: product.is_active,
    });
    setEditingId(product.id);
    setShowAddForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      await fetch(`/api/admin/store/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    resetForm();
    fetchProducts();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`確定刪除「${name}」？此操作無法復原。`)) return;
    await fetch(`/api/admin/store/${id}`, { method: "DELETE" });
    fetchProducts();
  }

  async function toggleActive(product: ShopProduct) {
    await fetch(`/api/admin/store/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    fetchProducts();
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-white/50">載入中...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">🏪 商店管理</h1>
          <p className="mt-1 text-sm text-white/60">
            管理商店商品的上架、編輯與下架。
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          ＋ 新增商品
        </button>
      </header>

      {/* 新增/編輯表單 */}
      {showAddForm && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? "編輯商品" : "新增商品"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1">商品名稱 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">分類</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-800">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">價格 (NT$) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  庫存 (-1 = 無限)
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  min={-1}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">圖片網址</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">描述</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm text-white/70">
                上架中
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
              >
                {editingId ? "儲存修改" : "建立商品"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 商品列表 */}
      {products.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/50 text-lg">還沒有任何商品</p>
          <p className="text-white/30 text-sm mt-2">
            點擊「新增商品」開始上架！
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition ${
                !product.is_active ? "opacity-50" : ""
              }`}
            >
              {/* 圖片 */}
              <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                    🏪
                  </div>
                )}
              </div>

              {/* 資訊 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold">{product.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/60">
                    {product.category}
                  </span>
                  {!product.is_active && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                      已下架
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-white/50 text-sm mt-0.5 truncate">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                  <span>NT$ {product.price.toLocaleString()}</span>
                  <span>
                    庫存: {product.stock === -1 ? "無限" : product.stock}
                  </span>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(product)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    product.is_active
                      ? "bg-white/10 text-white/70 hover:bg-white/20"
                      : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  }`}
                >
                  {product.is_active ? "下架" : "上架"}
                </button>
                <button
                  onClick={() => startEdit(product)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
