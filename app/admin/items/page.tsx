"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Item = {
  id: string;
  name: string;
  quantity: number;
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

export default function AdminItemsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newItem, setNewItem] = useState({
    event_id: "",
    name: "",
    quantity: "1",
    notes: ""
  });

  useEffect(() => {
    setLoadingUsers(true);
    Promise.all([
      fetch("/api/admin/items/users").then(res => res.json()),
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
      setItems([]);
      return;
    }

    setLoading(true);
    fetch(`/api/admin/items?user_id=${selectedUserId}`)
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  const handleAddItem = async () => {
    if (!selectedUserId || !newItem.name || !newItem.quantity) {
      alert("請填寫必填欄位");
      return;
    }

    try {
      const response = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          ...newItem,
          quantity: parseInt(newItem.quantity)
        })
      });

      if (!response.ok) throw new Error("新增失敗");

      setNewItem({
        event_id: "",
        name: "",
        quantity: "1",
        notes: ""
      });
      setShowAddForm(false);
      
      const { items: updatedItems } = await fetch(
        `/api/admin/items?user_id=${selectedUserId}`
      ).then(r => r.json());
      setItems(updatedItems || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "新增失敗");
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error("更新失敗");

      const { items: updatedItems } = await fetch(
        `/api/admin/items?user_id=${selectedUserId}`
      ).then(r => r.json());
      setItems(updatedItems || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失敗");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("確定要刪除這個物品記錄嗎？")) return;

    try {
      const response = await fetch(`/api/admin/items/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("刪除失敗");

      const { items: updatedItems } = await fetch(
        `/api/admin/items?user_id=${selectedUserId}`
      ).then(r => r.json());
      setItems(updatedItems || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">📦 物品管理</h1>
        <p className="mt-1 text-sm text-white/60">選擇會員後管理其物品記錄</p>
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
            步驟 2：管理 {selectedUser?.full_name || selectedUser?.email} 的物品記錄
          </h2>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">物品種類</p>
              <p className="mt-1 text-2xl font-bold text-blue-400">
                {items.length} 種
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">總數量</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {totalQuantity} 件
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="mb-4 rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {showAddForm ? "取消新增" : "+ 新增物品"}
          </button>

          {showAddForm && (
            <div className="mb-6 rounded-xl border border-white/20 bg-white/5 p-4">
              <h3 className="mb-3 font-semibold text-white/90">新增物品</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  物品名稱 *
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="請輸入物品名稱"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  數量 *
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="請輸入數量"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  活動
                  <select
                    value={newItem.event_id}
                    onChange={(e) => setNewItem({...newItem, event_id: e.target.value})}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
                  >
                    <option value="">（選填）</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1 text-xs text-white/60">
                備註
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                  rows={2}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="選填"
                />
              </label>
              <button
                onClick={handleAddItem}
                className="mt-3 rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                確認新增
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center text-white/50">載入中...</p>
          ) : items.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-6 text-center text-white/50">此會員尚無物品記錄</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  events={events}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, events, onUpdate, onDelete }: {
  item: Item;
  events: Event[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    quantity: item.quantity.toString(),
    event_id: item.event?.id || "",
    notes: item.notes || ""
  });

  const handleSave = () => {
    onUpdate(item.id, {
      ...form,
      quantity: parseInt(form.quantity)
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">{item.name}</p>
            <p className="text-sm text-blue-400">數量：{item.quantity} 件</p>
            {item.event && (
              <p className="mt-1 text-xs text-white/50">🎯 活動：{item.event.title}</p>
            )}
            {item.notes && <p className="mt-2 text-xs text-white/60">📝 {item.notes}</p>}
            <p className="mt-2 text-xs text-white/40">
              更新：{new Date(item.updated_at).toLocaleString("zh-TW")}
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
              onClick={() => onDelete(item.id)}
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
      <h4 className="mb-3 text-sm font-semibold text-white/90">編輯物品記錄</h4>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          物品名稱 *
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
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
