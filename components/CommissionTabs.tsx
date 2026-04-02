"use client";

import { useState, useEffect, useCallback } from "react";
import CommissionList from "@/components/CommissionList";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface TabConfig {
  key: string;
  label: string;
  statuses: string;
  dotColor: string;
  animate: boolean;
}

const TABS: TabConfig[] = [
  { key: "listed", label: "刊登中", statuses: "active,queued", dotColor: "bg-green-400", animate: true },
  { key: "inProgress", label: "進行中", statuses: "accepted,proof_submitted,proof_approved", dotColor: "bg-blue-400", animate: true },
  { key: "completed", label: "已完成", statuses: "completed", dotColor: "bg-gray-400", animate: false },
];

const PAGE_SIZE = 20;

interface TabState {
  commissions: any[];
  total: number;
  page: number;
  loading: boolean;
  hasMore: boolean;
}

interface CommissionTabsProps {
  initialCommissions: any[];
  initialTotal: number;
}

export default function CommissionTabs({ initialCommissions, initialTotal }: CommissionTabsProps) {
  const [activeTab, setActiveTab] = useState("listed");

  // 初始化各 tab 的狀態
  const [tabStates, setTabStates] = useState<Record<string, TabState>>(() => {
    const states: Record<string, TabState> = {};
    for (const tab of TABS) {
      if (tab.key === "listed") {
        states[tab.key] = {
          commissions: initialCommissions,
          total: initialTotal,
          page: 1,
          loading: false,
          hasMore: initialTotal > PAGE_SIZE,
        };
      } else {
        states[tab.key] = {
          commissions: [],
          total: -1, // -1 表示尚未載入
          page: 0,
          loading: false,
          hasMore: true,
        };
      }
    }
    return states;
  });

  const fetchTab = useCallback(async (tabKey: string, page: number, append: boolean) => {
    const tab = TABS.find((t) => t.key === tabKey);
    if (!tab) return;

    setTabStates((prev) => ({
      ...prev,
      [tabKey]: { ...prev[tabKey], loading: true },
    }));

    try {
      const res = await fetch(`/api/commissions?status=${tab.statuses}&page=${page}`);
      const data = await res.json();

      setTabStates((prev) => ({
        ...prev,
        [tabKey]: {
          commissions: append ? [...prev[tabKey].commissions, ...data.commissions] : data.commissions,
          total: data.total,
          page,
          loading: false,
          hasMore: page < data.totalPages,
        },
      }));
    } catch {
      setTabStates((prev) => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], loading: false },
      }));
    }
  }, []);

  // 切換 tab 時，如果尚未載入就 fetch
  useEffect(() => {
    const state = tabStates[activeTab];
    if (state.total === -1 && !state.loading) {
      fetchTab(activeTab, 1, false);
    }
  }, [activeTab, tabStates, fetchTab]);

  function handleLoadMore() {
    const state = tabStates[activeTab];
    if (state.loading || !state.hasMore) return;
    fetchTab(activeTab, state.page + 1, true);
  }

  const currentState = tabStates[activeTab];
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="flex flex-col gap-6">
      {/* Tab 列 */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {TABS.map((tab) => {
          const state = tabStates[tab.key];
          const isActive = activeTab === tab.key;
          const count = state.total >= 0 ? state.total : null;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "text-white/90 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500 after:rounded-full"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${tab.dotColor} ${tab.animate && isActive ? "animate-pulse" : ""}`}
              />
              {tab.label}
              {count !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-white/10 text-white/70" : "bg-white/5 text-white/30"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 內容區 */}
      {currentState.loading && currentState.commissions.length === 0 ? (
        <div className="glass-card p-8 text-center text-white/60">
          <p>載入中...</p>
        </div>
      ) : currentState.commissions.length === 0 ? (
        <div className="glass-card p-8 text-center text-white/60">
          <p>目前沒有{currentTab.label}的委託，稍後再來看看吧！</p>
        </div>
      ) : (
        <>
          <CommissionList commissions={currentState.commissions} />

          {/* 載入更多 */}
          {currentState.hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={currentState.loading}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white/80 disabled:opacity-50"
              >
                {currentState.loading ? "載入中..." : "載入更多"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
