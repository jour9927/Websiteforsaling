"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Payment = {
  id: string;
  amount: string;
  status: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event: {
    id: string | null;
    title: string | null;
  } | null;
};

type Event = {
  id: string;
  title: string | null;
};

const STATUSES = [
  { value: "pending", label: "待付款", color: "text-yellow-400" },
  { value: "paid", label: "已付款", color: "text-emerald-400" },
  { value: "overdue", label: "逾期", color: "text-rose-400" },
  { value: "cancelled", label: "已取消", color: "text-gray-400" }
] as const;

export default function AdminPaymentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newPayment, setNewPayment] = useState({
    event_id: "",
    amount: "",
    status: "pending",
    payment_date: "",
    notes: ""
  });

  useEffect(() => {
    setLoadingUsers(true);
    Promise.all([
      fetch("/api/admin/payments/users").then(res => res.json()),
      fetch("/api/events").then(res => res.json())
    ]).then(([usersData, eventsData]) => {
      console.log("Users data:", usersData);
      console.log("Events data:", eventsData);
      setUsers(usersData.users || []);
      setEvents(eventsData.events || []);
    }).catch(err => {
      console.error("Error fetching data:", err);
      alert("載入會員列表失敗，請重新整理頁面");
    }).finally(() => {
      setLoadingUsers(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setPayments([]);
      return;
    }

    setLoading(true);
    fetch(`/api/admin/payments?user_id=${selectedUserId}`)
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  const handleAddPayment = async () => {
    if (!selectedUserId || !newPayment.amount) {
      alert("請填寫必填欄位");
      return;
    }

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          ...newPayment
        })
      });

      if (!response.ok) throw new Error("新增失敗");

      setNewPayment({
        event_id: "",
        amount: "",
        status: "pending",
        payment_date: "",
        notes: ""
      });
      setShowAddForm(false);
      
      const { payments: updatedPayments } = await fetch(
        `/api/admin/payments?user_id=${selectedUserId}`
      ).then(r => r.json());
      setPayments(updatedPayments || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "新增失敗");
    }
  };

  const handleUpdatePayment = async (paymentId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error("更新失敗");

      const { payments: updatedPayments } = await fetch(
        `/api/admin/payments?user_id=${selectedUserId}`
      ).then(r => r.json());
      setPayments(updatedPayments || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失敗");
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("確定要刪除這筆付款記錄嗎？")) return;

    try {
      const response = await fetch(`/api/admin/payments/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("刪除失敗");

      const { payments: updatedPayments } = await fetch(
        `/api/admin/payments?user_id=${selectedUserId}`
      ).then(r => r.json());
      setPayments(updatedPayments || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidAmount = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAmount = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">�� 付款管理</h1>
        <p className="mt-1 text-sm text-white/60">選擇會員後管理其付款記錄</p>
      </header>

      <div className="glass-card rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white/90">步驟 1：選擇會員</h2>
        {loadingUsers ? (
          <p className="text-center text-white/50">載入會員列表中...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-white/50">找不到會員資料</p>
        ) : (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-white focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
          >
            <option value="">-- 請選擇會員 ({users.length} 位會員) --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name && user.email 
                  ? `${user.full_name} (${user.email})`
                  : user.full_name || user.email || "未命名"}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedUserId && (
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white/90">
            步驟 2：管理 {selectedUser?.full_name || selectedUser?.email} 的付款記錄
          </h2>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">已付款</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                NT$ {paidAmount.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">
                {payments.filter(p => p.status === "paid").length} 筆
              </p>
            </div>
            <div className="rounded-xl bg-yellow-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">待付款</p>
              <p className="mt-1 text-2xl font-bold text-yellow-400">
                NT$ {pendingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">
                {payments.filter(p => p.status === "pending").length} 筆
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">總計</p>
              <p className="mt-1 text-2xl font-bold text-white">
                NT$ {totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">{payments.length} 筆</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="mb-4 rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {showAddForm ? "取消新增" : "+ 新增付款記錄"}
          </button>

          {showAddForm && (
            <div className="mb-6 rounded-xl border border-white/20 bg-white/5 p-4">
              <h3 className="mb-3 font-semibold text-white/90">新增付款</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  活動
                  <select
                    value={newPayment.event_id}
                    onChange={(e) => setNewPayment({...newPayment, event_id: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
                  >
                    <option value="">（選填）</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  金額 *
                  <input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="請輸入金額"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  狀態
                  <select
                    value={newPayment.status}
                    onChange={(e) => setNewPayment({...newPayment, status: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  付款日期
                  <input
                    type="date"
                    value={newPayment.payment_date}
                    onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1 text-xs text-white/60">
                備註
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  rows={2}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="選填"
                />
              </label>
              <button
                onClick={handleAddPayment}
                className="mt-3 rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                確認新增
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center text-white/50">載入中...</p>
          ) : payments.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-6 text-center text-white/50">此會員尚無付款記錄</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  events={events}
                  onUpdate={handleUpdatePayment}
                  onDelete={handleDeletePayment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ payment, events, onUpdate, onDelete }: {
  payment: Payment;
  events: Event[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    amount: payment.amount,
    status: payment.status,
    payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : "",
    event_id: payment.event?.id || "",
    notes: payment.notes || ""
  });

  const handleSave = () => {
    onUpdate(payment.id, form);
    setIsEditing(false);
  };

  const statusInfo = STATUSES.find(s => s.value === payment.status);

  if (!isEditing) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">
              NT$ {Number(payment.amount).toLocaleString()}
            </p>
            <p className={`text-sm ${statusInfo?.color || "text-white/60"}`}>
              {statusInfo?.label || payment.status}
            </p>
            {payment.event && (
              <p className="mt-1 text-xs text-white/50">🎯 活動：{payment.event.title}</p>
            )}
            {payment.payment_date && (
              <p className="text-xs text-white/50">
                📅 日期：{new Date(payment.payment_date).toLocaleDateString("zh-TW")}
              </p>
            )}
            {payment.notes && <p className="mt-2 text-xs text-white/60">📝 {payment.notes}</p>}
            <p className="mt-2 text-xs text-white/40">
              更新：{new Date(payment.updated_at).toLocaleString("zh-TW")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
            >
              編輯
            </button>
            <button
              onClick={() => onDelete(payment.id)}
              className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/30"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
      <h4 className="mb-3 text-sm font-semibold text-white/90">編輯付款記錄</h4>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          金額 *
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({...form, amount: e.target.value})}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          狀態
          <select
            value={form.status}
            onChange={(e) => setForm({...form, status: e.target.value})}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          付款日期
          <input
            type="date"
            value={form.payment_date}
            onChange={(e) => setForm({...form, payment_date: e.target.value})}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          活動
          <select
            value={form.event_id}
            onChange={(e) => setForm({...form, event_id: e.target.value})}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
          >
            <option value="">（無）</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs text-white/60">
        備註
        <textarea
          value={form.notes}
          onChange={(e) => setForm({...form, notes: e.target.value})}
          rows={2}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
      </label>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          className="rounded-lg bg-emerald-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          儲存變更
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          取消
        </button>
      </div>
    </div>
  );
}
