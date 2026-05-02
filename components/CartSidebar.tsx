"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

export function CartSidebar() {
  const { items, removeItem, updateQuantity, totalAmount, totalItems } =
    useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 購物車按鈕（固定在右下） */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-black shadow-xl transition hover:bg-amber-400 active:scale-95"
      >
        <span className="text-lg">🛒</span>
        {totalItems > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-amber-400">
            {totalItems}
          </span>
        )}
      </button>

      {/* 側邊欄遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 側邊欄 */}
      <div
        className={`fixed top-0 right-0 z-[9999] h-full w-full max-w-md transform bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🛒 購物車
              {totalItems > 0 && (
                <span className="text-sm text-white/50">({totalItems})</span>
              )}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl opacity-30">🛒</span>
                <p className="mt-4 text-white/50">購物車是空的</p>
                <Link
                  href="/store"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition"
                >
                  去逛逛
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    {/* 圖片 */}
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-white/5 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl opacity-30">
                          🏪
                        </div>
                      )}
                    </div>

                    {/* 資訊 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-amber-400 mt-0.5">
                        {formatPrice(item.price)}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* 數量調整 */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-white/60 hover:bg-white/20 text-xs"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-white/60 hover:bg-white/20 text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* 小計 + 刪除 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-white/30 hover:text-red-400 transition text-xs"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-white/10 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">合計</span>
                <span className="text-xl font-bold text-amber-400">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <Link
                href="/store/checkout"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-xl bg-amber-500 py-3 text-center text-sm font-bold text-black hover:bg-amber-400 transition active:scale-[0.98]"
              >
                前往結帳
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
