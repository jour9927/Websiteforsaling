"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Delivery = {
  id: string;
  item_name: string;
  quantity: number;
  status: string;
  delivery_date: string | null;
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
  { value: "pending", label: "待交付", color: "text-yellow-400" },
  { value: "in_transit", label: "運送中", color: "text-blue-400" },
  { value: "delivered", label: "已交付", color: "text-emerald-400" },
  { value: "cancelled", label: "已取消", color: "text-gray-400" }
] as const;

export default function AdminDeliveriesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newDelivery, setNewDelivery] = useState({
    event_id: "",
    item_name: "",
    quantity: "1",
    status: "pending",
    delivery_date: "",
    notes: ""
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/deliveries/users").then(res => res.json()),
      fetch("/api/events").then(res => res.json())
    ]).then(([usersData, eventsData]) => {
      setUsers(usersData.users || []);
      setEvents(eventsData.events || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setDeliveries([]);
      return;
    }

    setLoading(true);
    fetch(`/api/admin/deliveries?user_id=${selectedUserId}`)
      .then(res => res.json())
      .then(data => setDeliveries(data.deliveries || []))
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  const handleAddDelivery = async () => {
    if (!selectedUserId || !newDelivery.item_name) {
      alert("請填寫必填欄位");
      return;
    }

    try {
      const response = await fetch("/api/admin/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          ...newDelivery,
          quantity: parseInt(newDelivery.quantity)
        })
      });

      if (!response.ok) throw new Error("新增失敗");

      setNewDelivery({
        event_id: "",
        item_name: "",
        quantity: "1",
        status: "pending",
        delivery_date: "",
        notes: ""
      });
      setShowAddForm(false);
      
      const { deliveries: updatedDeliveries } = await fetch(
        `/api/admin/deliveries?user_id=${selectedUserId}`
      ).then(r => r.json());
      setDeliveries(updatedDeliveries || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "新增失敗");
    }
  };

  const handleUpdateDelivery = async (deliveryId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error("更新失敗");

      const { deliveries: updatedDeliveries } = await fetch(
        `/api/admin/deliveries?user_id=${selectedUserId}`
      ).then(r => r.json());
      setDeliveries(updatedDeliveries || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失敗");
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!confirm("確定要刪除這筆交付記錄嗎？")) return;

    try {
      const response = await fetch(`/api/admin/deliveries/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("刪除失敗");

      const { deliveries: updatedDeliveries } = await fetch(
        `/api/admin/deliveries?user_id=${selectedUserId}`
      ).then(r => r.json());
      setDeliveries(updatedDeliveries || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const pendingCount = deliveries.filter(d => d.status === "pending").length;
  const inTransitCount = deliveries.filter(d => d.status === "in_transit").length;
  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">📦 交付記錄管理</h1>
        <p className="mt-1 text-sm text-white/60">選擇會員後管理其交付記錄</p>
      </header>

      <div className="glass-card rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white/90">步驟 1：選擇會員</h2>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-white focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
        >
          <option value="">-- 請選擇會員 --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name && user.email 
                ? `${user.full_name} (${user.email})`
                : user.full_name || user.email || "未命名"}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white/90">
            步驟 2：管理 {selectedUser?.full_name || selectedUser?.email} 的交付記錄
          </h2>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-yellow-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">待交付</p>
              <p className="mt-1 text-2xl font-bold text-yellow-400">{pendingCount}</p>
              <p className="text-xs text-white/40">筆記錄</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">運送中</p>
              <p className="mt-1 text-2xl font-bold text-blue-400">{inTransitCount}</p>
              <p className="text-xs text-white/40">筆記錄</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">已交付</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{deliveredCount}</p>
              <p className="text-xs text-white/40">筆記錄</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="mb-4 rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {showAddForm ? "取消新增" : "+ 新增交付記錄"}
          </button>

          {showAddForm && (
            <div className="mb-6 rounded-xl border border-white/20 bg-white/5 p-4">
              <h3 className="mb-3 font-semibold text-white/90">新增交付</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  物品名稱 *
                  <input
                    type="text"
                    value={newDelivery.item_name}
                    onChange={(e) => setNewDelivery({...newDelivery, item_name: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="請輸入物品名稱"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  數量 *
                  <input
                    type="number"
                    min="1"
                    value={newDelivery.quantity}
                    onChange={(e) => setNewDelivery({...newDelivery, quantity: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  活動
                  <select
                    value={newDelivery.event_id}
                    onChange={(e) => setNewDelivery({...newDelivery, event_id: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
                  >
                    <option value="">（選填）</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  狀態
                  <select
                    value={newDelivery.status}
                    onChange={(e) => setNewDelivery({...newDelivery, status: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  交付日期
                  <input
                    type="date"
                    value={newDelivery.delivery_date}
                    onChange={(e) => setNewDelivery({...newDelivery, delivery_date: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1 text-xs text-white/60">
                備註
                <textarea
                  value={newDelivery.notes}
                  onChange={(e) => setNewDelivery({...newDelivery, notes: e.target.value})}
                  rows={2}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="選填"
                />
              </label>
              <button
                onClick={handleAddDelivery}
                className="mt-3 rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                確認新增
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center text-white/50">載入中...</p>
          ) : deliveries.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-6 text-center text-white/50">此會員尚無交付記錄</p>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <DeliveryRow
                  key={delivery.id}
                  delivery={delivery}
                  events={events}
                  onUpdate={handleUpdateDelivery}
                  onDelete={handleDeleteDelivery}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryRow({ delivery, events, onUpdate, onDelete }: {
  delivery: Delivery;
  events: Event[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    item_name: delivery.item_name,
    quantity: delivery.quantity.toString(),
    status: delivery.status,
    delivery_date: delivery.delivery_date ? new Date(delivery.delivery_date).toISOString().split('T')[0] : "",
    event_id: delivery.event?.id || "",
    notes: delivery.notes || ""
  });

  const handleSave = () => {
    onUpdate(delivery.id, { ...form, quantity: parseInt(form.quantity) });
    setIsEditing(false);
  };

  const statusInfo = STATUSES.find(s => s.value === delivery.status);

  if (!isEditing) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">{delivery.item_name}</p>
            <p className="text-sm text-white/60">數量：{delivery.quantity}</p>
            <p className={`text-sm \${statusInfo?.color || "text-white/60"}`}>
              {statusInfo?.label || delivery.status}
            </p>
            {delivery.event && (
              <p className="mt-1 text-xs text-white/50">🎯 活動：{delivery.event.title}</p>
            )}
            {delivery.delivery_date && (
              <p className="text-xs text-white/50">
                📅 日期：{new Date(delivery.delivery_date).toLocaleDateString("zh-TW")}
              </p>
            )}
            {delivery.notes && <p className="mt-2 text-xs text-white/60">📝 {delivery.notes}</p>}
            <p className="mt-2 text-xs text-white/40">
              更新：{new Date(delivery.updated_at).toLocaleString("zh-TW")}
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
              onClick={() => onDelete(delivery.id)}
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
      <h4 className="mb-3 text-sm font-semibold text-white/90">編輯交付記錄</h4>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          物品名稱 *
          <input
            type="text"
            value={form.item_name}
            onChange={(e) => setForm({...form, item_name: e.target.value})}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          數量 *
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({...form, quantity: e.target.value})}
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
          交付日期
          <input
            type="date"
            value={form.delivery_date}
            onChange={(e) => setForm({...form, delivery_date: e.target.value})}
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
