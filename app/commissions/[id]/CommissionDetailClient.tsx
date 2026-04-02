"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CommissionDetailClientProps {
  commission: any;
  currentUserId: string | null;
}

function priceLabel(basePrice: number, priceType: string) {
  const unit = priceType === "twd" ? "NT$" : "";
  const suffix = priceType === "twd" ? "" : " pts";
  return `${unit}${basePrice.toLocaleString()}${suffix}`;
}

const statusFlow = [
  { key: "pending_review", label: "待審核" },
  { key: "active", label: "開放中" },
  { key: "accepted", label: "已接單" },
  { key: "proof_submitted", label: "證明審核" },
  { key: "proof_approved", label: "證明通過" },
  { key: "completed", label: "已完成" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_review: { label: "待審核", color: "text-yellow-400" },
  approved: { label: "已審核", color: "text-blue-400" },
  queued: { label: "排隊中", color: "text-yellow-400" },
  active: { label: "開放中", color: "text-green-400" },
  accepted: { label: "已接單", color: "text-blue-400" },
  proof_submitted: { label: "證明審核中", color: "text-purple-400" },
  proof_approved: { label: "證明已通過", color: "text-indigo-400" },
  completed: { label: "已完成", color: "text-gray-400" },
  cancelled: { label: "已取消", color: "text-red-400" },
};

export default function CommissionDetailClient({ commission, currentUserId }: CommissionDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [executorFeeInput, setExecutorFeeInput] = useState("");

  const c = commission;
  const isPoster = currentUserId === c.poster_id;
  const isExecutor = currentUserId === c.executor_id;
  const posterName = c.poster?.display_name;
  const executorName = c.executor?.display_name;
  const statusInfo = statusLabels[c.status] || { label: c.status, color: "text-white/60" };

  // 計算進度
  const currentStep = statusFlow.findIndex((s) => s.key === c.status);

  async function handleAccept() {
    if (!currentUserId) return;
    setLoading(true);
    setError("");
    setMessage("");

    const body: Record<string, unknown> = {};
    if (executorFeeInput && parseInt(executorFeeInput) > 0) {
      body.executor_fee = parseInt(executorFeeInput);
    }

    const res = await fetch(`/api/commissions/${c.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage(data.message);
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  }

  async function handleProposeFee() {
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch(`/api/commissions/${c.id}/executor-fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "propose", executor_fee: parseInt(executorFeeInput) }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage(data.message);
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  }

  async function handleFeeDecision(action: "approve" | "reject") {
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch(`/api/commissions/${c.id}/executor-fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage(data.message);
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      {/* 返回按鈕 */}
      <Link href={"/commissions" as Route} className="text-sm text-white/40 hover:text-white/60">
        ← 返回委託列表
      </Link>

      {/* 主卡片 */}
      <div className="glass-card p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {c.distributions?.pokemon_sprite_url ? (
              <img
                src={c.distributions.pokemon_sprite_url}
                alt={c.pokemon_name}
                className="h-16 w-16 rounded-xl bg-white/5 object-contain p-2"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-2xl">🎴</div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white/90">{c.pokemon_name}</h1>
              {c.distributions?.pokemon_name_en && (
                <p className="text-sm text-white/40">{c.distributions.pokemon_name_en}</p>
              )}
              <p className="mt-1 text-xs text-white/50">
                刊登者：{posterName || "匿名"} · {new Date(c.created_at).toLocaleDateString("zh-TW")}
              </p>
            </div>
          </div>
          <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>

        {/* 進度條 */}
        {c.status !== "cancelled" && c.status !== "queued" && (
          <div className="mt-6 flex items-center gap-1">
            {statusFlow.map((step, i) => (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <div
                  className={`h-2 w-full rounded-full ${
                    i <= currentStep ? "bg-indigo-500" : "bg-white/10"
                  }`}
                />
                <span className={`mt-1 text-[10px] ${i <= currentStep ? "text-indigo-400" : "text-white/30"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 說明 */}
        {c.description && (
          <div className="mt-6 rounded-xl bg-white/5 p-4">
            <h3 className="mb-1 text-xs font-medium text-white/50">備註</h3>
            <p className="text-sm text-white/70 whitespace-pre-wrap">{c.description}</p>
          </div>
        )}
      </div>

      {/* 價格資訊 */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-white/70">💰 價格資訊</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-xs text-white/40">底價（{c.price_type === "twd" ? "台幣" : "點數"}）</p>
            <p className="mt-1 text-lg font-bold text-amber-400">{priceLabel(c.base_price, c.price_type)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-xs text-white/40">執行者可抽成</p>
            <p className="mt-1 text-lg font-bold text-white/70">{priceLabel(c.platform_fee, c.price_type)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-xs text-white/40">
              執行者抽成
              {c.executor_fee > 0 && !c.executor_fee_approved && (
                <span className="ml-1 text-yellow-400">⏳ 待確認</span>
              )}
              {c.executor_fee_approved && <span className="ml-1 text-green-400">✓</span>}
            </p>
            <p className="mt-1 text-lg font-bold text-white/70">{priceLabel(c.executor_fee, c.price_type)}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-white/40">
          抽成上限：{priceLabel(Math.floor((c.base_price * 4) / 5), c.price_type)}（底價的 4/5）
        </p>
      </div>

      {/* 配布圖鑑資料 */}
      {c.distributions && (
        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">📖 配布圖鑑資料</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {c.distributions.generation && (
              <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/40">世代</span>
                <span className="text-white/70">第 {c.distributions.generation} 世代</span>
              </div>
            )}
            {c.distributions.original_trainer && (
              <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/40">OT</span>
                <span className="text-white/70">{c.distributions.original_trainer}</span>
              </div>
            )}
            {c.distributions.distribution_method && (
              <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/40">配布方式</span>
                <span className="text-white/70">{c.distributions.distribution_method}</span>
              </div>
            )}
            {c.distributions.region && (
              <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/40">地區</span>
                <span className="text-white/70">{c.distributions.region}</span>
              </div>
            )}
            {c.distributions.is_shiny && (
              <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/40">色違</span>
                <span className="text-amber-400">✨ 是</span>
              </div>
            )}
            {c.distributions.points && (
              <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/40">市值</span>
                <span className="text-amber-400">{c.distributions.points.toLocaleString()} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 合法性證明 */}
      {c.proof_images && c.proof_images.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">📄 合法性證明</h2>
          <div className="flex flex-col gap-3">
            {/* 圖片類 */}
            {(() => {
              const images = c.proof_images.filter((url: string) => !url.startsWith("http://") && !url.startsWith("https://") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(url));
              const links = c.proof_images.filter((url: string) => (url.startsWith("http://") || url.startsWith("https://")) && !/\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(url));
              return (
                <>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {images.map((url: string, i: number) => (
                        <img
                          key={`img-${i}`}
                          src={url}
                          alt={`證明 ${i + 1}`}
                          className="h-32 w-32 rounded-xl border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {links.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {links.map((url: string, i: number) => (
                        <a
                          key={`link-${i}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-3 text-sm text-indigo-400 transition hover:bg-white/10"
                        >
                          <span>🔗</span>
                          <span className="truncate">{url}</span>
                          <span className="ml-auto text-xs text-white/30">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 押底資訊 */}
      {c.commission_deposits && c.commission_deposits.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">🛡️ 押底資訊</h2>
          {c.commission_deposits.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <p className="text-sm text-white/70">{d.deposit_pokemon_name}</p>
                <p className="text-xs text-white/40">價值：{d.deposit_pokemon_value.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    d.status === "held"
                      ? "text-amber-400"
                      : d.status === "returned"
                        ? "text-green-400"
                        : "text-blue-400"
                  }`}
                >
                  {d.status === "held" ? "持有中" : d.status === "returning" ? "歸還中" : "已歸還"}
                </span>
                {d.return_eligible_at && d.status === "held" && (
                  <p className="text-xs text-white/40">
                    預計歸還：{new Date(d.return_eligible_at).toLocaleDateString("zh-TW")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 執行者資訊 */}
      {executorName && (
        <div className="glass-card p-6">
          <h2 className="mb-2 text-sm font-semibold text-white/70">👤 執行者</h2>
          <p className="text-white/70">{executorName}</p>
          {c.accepted_at && (
            <p className="text-xs text-white/40">
              接單時間：{new Date(c.accepted_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
            </p>
          )}
        </div>
      )}

      {/* 互動區 */}
      <div className="glass-card p-6">
        {/* 接單按鈕 + 提出抽成 */}
        {c.status === "active" && currentUserId && !isPoster && (
          <div className="flex flex-col gap-4">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
            >
              {loading ? "處理中..." : "✋ 接受此委託"}
            </button>

            {/* 提出新的抽成價格 */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white/70">💬 提出你的抽成價格（選填）</h3>
              <p className="mb-3 text-xs text-white/40">
                接單後可向刊登者提出你期望的抽成，刊登者需同意後才生效。不填則以刊登者設定為準。
              </p>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={executorFeeInput}
                  onChange={(e) => setExecutorFeeInput(e.target.value)}
                  placeholder={`抽成金額（${c.price_type === "twd" ? "NT$" : "pts"}）`}
                  min="0"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
                />
                <span className="flex items-center text-xs text-white/40">
                  {c.price_type === "twd" ? "NT$" : "pts"}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/40">
                上限：{priceLabel(Math.floor(((c.base_price * 4) / 5 - c.platform_fee)), c.price_type)}
              </p>
            </div>
          </div>
        )}

        {/* 未登入提示 */}
        {c.status === "active" && !currentUserId && (
          <Link
            href={`/login?redirect=/commissions/${c.id}` as Route}
            className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            登入以接受委託
          </Link>
        )}

        {/* 執行者提交/修改抽成 */}
        {isExecutor && (c.status === "accepted" || c.status === "queued") && !c.executor_fee_approved && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white/70">
              {c.executor_fee > 0 ? "修改你的抽成" : "提出你的抽成"}
            </h3>
            {c.executor_fee > 0 && (
              <p className="text-xs text-white/40">
                目前提出：<span className="text-amber-400">{priceLabel(c.executor_fee, c.price_type)}</span>（等待刊登者確認）
              </p>
            )}
            <div className="flex gap-3">
              <input
                type="number"
                value={executorFeeInput}
                onChange={(e) => setExecutorFeeInput(e.target.value)}
                placeholder={`新的抽成金額（${c.price_type === "twd" ? "NT$" : "pts"}）`}
                min="0"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                onClick={handleProposeFee}
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {c.executor_fee > 0 ? "重新提交" : "提交"}
              </button>
            </div>
            <p className="text-xs text-white/40">
              上限：{priceLabel(Math.floor(((c.base_price * 4) / 5 - c.platform_fee)), c.price_type)}
            </p>
          </div>
        )}

        {/* 賣家審核執行者抽成 */}
        {isPoster && c.executor_fee > 0 && !c.executor_fee_approved && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white/70">
              執行者提出抽成：<span className="text-amber-400">{priceLabel(c.executor_fee, c.price_type)}</span>
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleFeeDecision("approve")}
                disabled={loading}
                className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm text-white hover:bg-green-500 disabled:opacity-50"
              >
                ✓ 同意
              </button>
              <button
                onClick={() => handleFeeDecision("reject")}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm text-white hover:bg-red-500 disabled:opacity-50"
              >
                ✕ 拒絕
              </button>
            </div>
          </div>
        )}

        {/* 排隊中 */}
        {c.status === "queued" && (
          <div className="flex flex-col gap-4">
            <div className="text-center text-white/60">
              <p className="text-sm">此委託正在排隊中</p>
              <p className="text-xs text-white/40">排隊位置 #{c.queue_position}，每日平台處理上限為 5 單</p>
            </div>

            {currentUserId && !isPoster && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                >
                  {loading ? "處理中..." : "📋 我要預約執行委託"}
                </button>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-white/70">💬 提出你的抽成價格（選填）</h3>
                  <p className="mb-3 text-xs text-white/40">
                    預約後，當委託正式啟用時你將成為執行者。不填抽成則以刊登者設定為準。
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={executorFeeInput}
                      onChange={(e) => setExecutorFeeInput(e.target.value)}
                      placeholder={`抽成金額（${c.price_type === "twd" ? "NT$" : "pts"}）`}
                      min="0"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
                    />
                    <span className="flex items-center text-xs text-white/40">
                      {c.price_type === "twd" ? "NT$" : "pts"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    上限：{priceLabel(Math.floor(((c.base_price * 4) / 5 - c.platform_fee)), c.price_type)}
                  </p>
                </div>
              </div>
            )}

            {!currentUserId && (
              <Link
                href={`/login?redirect=/commissions/${c.id}` as Route}
                className="block w-full rounded-xl bg-amber-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-500"
              >
                登入以預約執行委託
              </Link>
            )}
          </div>
        )}

        {/* 已完成 */}
        {c.status === "completed" && (
          <div className="text-center text-green-400">
            <p className="text-sm font-semibold">✅ 此委託已完成</p>
            {c.completed_at && (
              <p className="text-xs text-white/40">
                完成時間：{new Date(c.completed_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
              </p>
            )}
          </div>
        )}

        {/* 錯誤/成功訊息 */}
        {error && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
