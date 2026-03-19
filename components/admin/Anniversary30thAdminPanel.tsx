"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ContractSummary = {
  id: string;
  contract_type: "main" | "additional";
  pokemon_name: string | null;
  status: string;
  payment_record_id: string | null;
  delivery_record_id: string | null;
  price: number;
  notes: string | null;
  payment: { id: string; status: string; payment_date: string | null; amount: number } | null;
  delivery: { id: string; status: string; delivery_date: string | null; item_name: string } | null;
};

type ParticipantRow = {
  participant: {
    id: string;
    user_id: string;
    target_pokemon: string;
    current_rank: number | null;
    best_rank: number | null;
    final_rank: number | null;
    total_battles_used: number;
    has_entered_top_cut: boolean;
    created_at: string;
  };
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  revealState: {
    revealed_pokemon: string | null;
    price_resolved: number | null;
  } | null;
  curatedRoute: {
    force_final_top_cut: boolean;
    force_additional_pokemon: string | null;
    force_additional_price: number | null;
    preferred_templates: string[];
  } | null;
  mainContract: ContractSummary | null;
  additionalContract: ContractSummary | null;
};

type CampaignSummary = {
  id: string;
  title: string;
  slug: string;
  event_id: string | null;
};

type UserOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type FormState = {
  forceFinalTopCut: boolean;
  forceAdditionalPokemon: string;
  forceAdditionalPrice: string;
};

function contractTone(status: string | null | undefined) {
  if (status === "delivered") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "paid" || status === "secured") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  if (status === "holding" || status === "priced" || status === "unlocked") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (status === "refunded" || status === "forfeited") return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  return "border-white/10 bg-white/5 text-white/65";
}

export function Anniversary30thAdminPanel() {
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [targetPokemon, setTargetPokemon] = useState("伊布");
  const [markPaidOffline, setMarkPaidOffline] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadParticipants() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/anniversary-30th/participants");
      const payload = (await response.json()) as {
        error?: string;
        campaign?: CampaignSummary;
        participants?: ParticipantRow[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "無法載入 30 週年控制台");
      }

      const participantRows = payload.participants || [];
      setCampaign(payload.campaign || null);
      setParticipants(participantRows);
      setForms(
        participantRows.reduce<Record<string, FormState>>((accumulator, row) => {
          accumulator[row.participant.id] = {
            forceFinalTopCut: row.curatedRoute?.force_final_top_cut || false,
            forceAdditionalPokemon: row.curatedRoute?.force_additional_pokemon || "",
            forceAdditionalPrice:
              row.curatedRoute?.force_additional_price !== null && row.curatedRoute?.force_additional_price !== undefined
                ? String(row.curatedRoute.force_additional_price)
                : "",
          };
          return accumulator;
        }, {}),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "無法載入 30 週年控制台");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch("/api/admin/payments/users");
      const payload = (await response.json()) as { error?: string; users?: UserOption[] };
      if (!response.ok) {
        throw new Error(payload.error || "無法載入會員清單");
      }
      setUsers(payload.users || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "無法載入會員清單");
    }
  }

  useEffect(() => {
    loadParticipants();
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    return {
      total: participants.length,
      topCutEntered: participants.filter((row) => row.participant.has_entered_top_cut).length,
      mainClaimable: participants.filter((row) => row.mainContract?.status === "secured").length,
      additionalPaid: participants.filter((row) => row.additionalContract?.status === "paid").length,
    };
  }, [participants]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = (user.full_name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, userSearch]);

  const selectedUser = useMemo(
    () => users.find((entry) => entry.id === selectedUserId) || null,
    [users, selectedUserId],
  );

  function updateForm(participantId: string, patch: Partial<FormState>) {
    setForms((current) => ({
      ...current,
      [participantId]: {
        ...current[participantId],
        ...patch,
      },
    }));
  }

  async function handleSaveRoute(participantId: string) {
    const form = forms[participantId];
    if (!form) return;

    setSavingId(participantId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/anniversary-30th/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          forceFinalTopCut: form.forceFinalTopCut,
          forceAdditionalPokemon: form.forceAdditionalPokemon.trim() || null,
          forceAdditionalPrice: form.forceAdditionalPrice.trim() || null,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "無法儲存導演路線");
      }

      setMessage("隱藏導演設定已更新。");
      await loadParticipants();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "無法儲存導演路線");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreateDelivery(participantId: string, contractType: "main" | "additional") {
    setDeliveryId(`${participantId}:${contractType}`);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/anniversary-30th/contracts/delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          contractType,
        }),
      });
      const payload = (await response.json()) as { error?: string; alreadyExists?: boolean };

      if (!response.ok) {
        throw new Error(payload.error || "無法建立交付記錄");
      }

      setMessage(payload.alreadyExists ? "交付記錄已存在。" : "已建立新的交付記錄。");
      await loadParticipants();
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : "無法建立交付記錄");
    } finally {
      setDeliveryId(null);
    }
  }

  async function handleAdminEnroll() {
    if (!selectedUserId) {
      setError("請先選擇要代為參戰的會員。");
      return;
    }

    if (!targetPokemon.trim()) {
      setError("請先填寫主契約寶可夢。");
      return;
    }

    setEnrolling(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/anniversary-30th/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          targetPokemon: targetPokemon.trim(),
          markPaidOffline,
        }),
      });
      const payload = (await response.json()) as { error?: string; user?: { full_name?: string | null; email?: string | null } };

      if (!response.ok) {
        throw new Error(payload.error || "無法代會員建立參戰資格");
      }

      const userLabel = payload.user?.full_name || payload.user?.email || "該會員";
      setMessage(`已為 ${userLabel} 建立 30 週年參戰資格。`);
      setSelectedUserId("");
      setTargetPokemon("伊布");
      setUserSearch("");
      await loadParticipants();
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : "無法代會員建立參戰資格");
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">30th Anniversary Control</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              {campaign?.title || "30 週年守護戰控制台"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              這裡專門處理隱藏導演、追加契約結果，以及兩份契約的付款與交付接點。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/payments"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              前往付款管理
            </Link>
            <Link
              href="/admin/deliveries"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              前往交付管理
            </Link>
            <button
              type="button"
              onClick={loadParticipants}
              className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
            >
              重新整理
            </button>
          </div>
        </div>
      </header>

      <div className="glass-card rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Admin Enroll</p>
        <h2 className="mt-2 text-xl font-semibold text-white">代會員建立 30 週年參戰資格</h2>
        <p className="mt-2 text-sm text-white/65">
          用在會員已線下付款、需要管理員直接幫忙開通主契約資格的情境。
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.25em] text-white/45">
            搜尋會員
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="輸入姓名或 email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="text-xs uppercase tracking-[0.25em] text-white/45">
            指定會員
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            >
              <option value="">請選擇會員</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {(user.full_name || "未命名")} {user.email ? `(${user.email})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs uppercase tracking-[0.25em] text-white/45">
            主契約寶可夢
            <input
              value={targetPokemon}
              onChange={(event) => setTargetPokemon(event.target.value)}
              placeholder="例如：伊布"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={markPaidOffline}
              onChange={(event) => setMarkPaidOffline(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/20"
            />
            線下已收款，建立主契約付款紀錄為已付款
          </label>
          <button
            type="button"
            onClick={handleAdminEnroll}
            disabled={enrolling}
            className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enrolling ? "建立中..." : "幫會員參戰"}
          </button>
        </div>

        {selectedUser ? (
          <p className="mt-3 text-xs text-white/45">
            目前選擇：{selectedUser.full_name || "未命名用戶"} {selectedUser.email ? `(${selectedUser.email})` : ""}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card rounded-2xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">總參戰者</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl border border-emerald-500/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">曾進前 10</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{stats.topCutEntered}</p>
        </div>
        <div className="glass-card rounded-2xl border border-sky-500/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">主契約已守住</p>
          <p className="mt-2 text-2xl font-semibold text-sky-200">{stats.mainClaimable}</p>
        </div>
        <div className="glass-card rounded-2xl border border-amber-500/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">追加契約已付款</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">{stats.additionalPaid}</p>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <div className="glass-card rounded-2xl border border-white/10 p-6 text-center text-white/60">
          載入 30 週年控制資料中...
        </div>
      ) : participants.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 p-6 text-center text-white/60">
          目前還沒有任何 30 週年參戰者。
        </div>
      ) : (
        <div className="space-y-5">
          {participants.map((row) => {
            const form = forms[row.participant.id];
            const canCreateMainDelivery =
              row.mainContract &&
              !row.mainContract.delivery_record_id &&
              ["secured", "paid", "delivered"].includes(row.mainContract.status);
            const canCreateAdditionalDelivery =
              row.additionalContract &&
              !row.additionalContract.delivery_record_id &&
              ["paid", "delivered"].includes(row.additionalContract.status);

            return (
              <article key={row.participant.id} className="glass-card rounded-3xl border border-white/10 p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4 xl:max-w-[320px]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/45">參戰者</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {row.profile?.full_name || row.profile?.email || "未命名用戶"}
                      </p>
                      <p className="mt-1 text-sm text-white/50">{row.profile?.email || "無 email"}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">主契約目標</p>
                        <p className="mt-2 text-lg font-semibold text-white">{row.participant.target_pokemon}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">排名</p>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          目前：{row.participant.current_rank || "未進榜"}<br />
                          最佳：{row.participant.best_rank || "未進榜"}<br />
                          總場次：{row.participant.total_battles_used}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-5 lg:grid-cols-[1.05fr,0.95fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${contractTone(row.mainContract?.status)}`}>
                            主契約：{row.mainContract?.status || "未建立"}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${contractTone(row.additionalContract?.status)}`}>
                            追加契約：{row.additionalContract?.status || "未建立"}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.participant.has_entered_top_cut ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/60"}`}>
                            {row.participant.has_entered_top_cut ? "已曾進前 10" : "尚未進前 10"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.25em] text-white/40">主契約付款 / 交付</p>
                            <p className="mt-3 text-sm leading-6 text-white/70">
                              付款：{row.mainContract?.payment?.status || "未建立"}<br />
                              交付：{row.mainContract?.delivery?.status || "未建立"}<br />
                              物品：{row.mainContract?.pokemon_name || row.participant.target_pokemon}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.25em] text-white/40">追加契約付款 / 交付</p>
                            <p className="mt-3 text-sm leading-6 text-white/70">
                              顯現：{row.revealState?.revealed_pokemon || "尚未顯現"}<br />
                              金額：{row.revealState?.price_resolved ? `NT$ ${Number(row.revealState.price_resolved).toLocaleString()}` : "未定價"}<br />
                              付款：{row.additionalContract?.payment?.status || "未建立"}<br />
                              交付：{row.additionalContract?.delivery?.status || "未建立"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleCreateDelivery(row.participant.id, "main")}
                            disabled={!canCreateMainDelivery || deliveryId === `${row.participant.id}:main`}
                            className="rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deliveryId === `${row.participant.id}:main` ? "建立中..." : "建立主契約交付"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateDelivery(row.participant.id, "additional")}
                            disabled={!canCreateAdditionalDelivery || deliveryId === `${row.participant.id}:additional`}
                            className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deliveryId === `${row.participant.id}:additional` ? "建立中..." : "建立追加契約交付"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/45">隱藏導演設定</p>

                      <label className="mt-4 flex items-center gap-3 text-sm text-white/75">
                        <input
                          type="checkbox"
                          checked={form?.forceFinalTopCut || false}
                          onChange={(event) =>
                            updateForm(row.participant.id, { forceFinalTopCut: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-white/20 bg-black/20"
                        />
                        強制最終守住前 10
                      </label>

                      <div className="mt-4 grid gap-3">
                        <label className="text-xs uppercase tracking-[0.25em] text-white/40">
                          指定追加契約寶可夢
                          <input
                            value={form?.forceAdditionalPokemon || ""}
                            onChange={(event) =>
                              updateForm(row.participant.id, { forceAdditionalPokemon: event.target.value })
                            }
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
                            placeholder="例如：伊布"
                          />
                        </label>

                        <label className="text-xs uppercase tracking-[0.25em] text-white/40">
                          指定追加契約價格
                          <input
                            type="number"
                            value={form?.forceAdditionalPrice || ""}
                            onChange={(event) =>
                              updateForm(row.participant.id, { forceAdditionalPrice: event.target.value })
                            }
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
                            placeholder="例如：2990"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveRoute(row.participant.id)}
                        disabled={savingId === row.participant.id}
                        className="mt-5 w-full rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === row.participant.id ? "儲存中..." : "儲存這位參戰者的暗線設定"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
