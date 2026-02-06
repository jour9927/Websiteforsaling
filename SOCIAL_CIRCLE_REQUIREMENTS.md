# 社交圈頁面需求文件

## 專案背景

### 現有專案
- **專案名稱**: Event Glass (活動報名與抽獎網站)
- **技術棧**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase
- **部署平台**: Vercel
- **GitHub**: https://github.com/jour9927/Websiteforsaling

### 目標客群
- **高淨值客戶**：需要營造尊貴、專屬的 VIP 氛圍
- **目標**：增加用戶黏性，讓客戶更依賴這個網站

---

## 實作進度

### ✅ 已完成功能

#### 1. 模擬在線人數 (`SimulatedViewers`)
| 功能 | 狀態 |
|------|------|
| 隨時間動態變化 | ✅ |
| 最後一分鐘激增 | ✅ |
| 統一兩處顯示（標題旁 + 左下角浮動） | ✅ |
| 使用 ViewerContext 全局同步 | ✅ |

**顯示規則：**
- 0-30 秒：5-10 人
- 1-3 分鐘：12-20 人
- 3+ 分鐘：18-30 人
- 最後 1 分鐘：+5-10 人激增

---

#### 2. 模擬出價系統 (`BidHistoryWithSimulation`)
| 功能 | 狀態 |
|------|------|
| 基於 auctionId 確定性生成 | ✅ |
| 混合真實 + 模擬出價排序 | ✅ |
| 真實出價必須高於模擬最高價 | ✅ |
| 通過 Portal 同步更新最高價 | ✅ |

**整合邏輯：**
```
有效最高價 = MAX(真實最高價, 模擬最高價, 起標價)
最低出價 = 有效最高價 + 最低加價
```

---

#### 3. 即時留言系統 (`AuctionComments`)
| 功能 | 狀態 |
|------|------|
| 真實留言存入資料庫 | ✅ |
| 即時訂閱 Realtime | ✅ |
| 模擬留言穿插 | ✅ |
| 標記自己的留言（高亮 + "你" 標籤） | ✅ |

**智能模擬：**
- 模擬用戶 30% 機率相互 @
- 留言內容圍繞競標主題
- 網站/活動相關留言混合

**心理學 @回覆：**
- 延遲 10-15 秒後才回覆
- 每人只回一次（避免重複）
- 回覆模板：「什麼意思？」「為什麼這樣說」「認真？」等引發好奇

---

#### 4. 出價 Toast 通知 (`SimulatedBidToast`)
| 功能 | 狀態 |
|------|------|
| 右下角彈出通知 | ✅ |
| 隨機間隔顯示 | ✅ |
| 自動消失動畫 | ✅ |

**⚠️ 待改進：** 目前未與模擬出價連動，需要強化

---

### 📋 待實作功能

#### Toast 連動強化（優先）
- [ ] 連動模擬出價紀錄（同步顯示）
- [ ] 最後一分鐘倒數提醒
- [ ] 真實出價也顯示 Toast
- [ ] 競爭心理觸發訊息：「有人剛出價！」「競爭激烈！」

#### 其他計劃
- [ ] 社交圈專屬頁面 `/social`
- [ ] 會員榮耀榜
- [ ] VIP 等級系統
- [ ] 熱門排行

---

## 資料表結構

### auction_comments（已建立）
```sql
CREATE TABLE auction_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 索引和 RLS
```sql
CREATE INDEX idx_auction_comments_auction_id ON auction_comments(auction_id);
CREATE INDEX idx_auction_comments_created_at ON auction_comments(created_at DESC);

-- 所有人可讀取
CREATE POLICY "Anyone can read" ON auction_comments FOR SELECT USING (true);
-- 登入可留言
CREATE POLICY "Auth can insert" ON auction_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- 只能刪自己
CREATE POLICY "Delete own" ON auction_comments FOR DELETE USING (auth.uid() = user_id);
```

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `components/SimulatedActivity.tsx` | SimulatedViewers, SimulatedBidToast, SimulatedRecentActivity |
| `components/AuctionComments.tsx` | 即時留言系統 |
| `hooks/useSimulatedAuction.ts` | 模擬出價和在線人數 Hook |
| `app/auctions/[id]/BidHistoryWithSimulation.tsx` | 出價紀錄 + ViewerContext |
| `app/auctions/[id]/AuctionPageClient.tsx` | Portal 渲染控制 |
| `app/auctions/[id]/BidButton.tsx` | 整合模擬最高價的出價按鈕 |

---

## 注意事項

### 道德邊界
- 以「展示社群活躍度」為主，避免完全虛假的用戶資料
- 模擬動態應合理，避免過度誇大

### 真實感原則
- 動態內容要合理（時間、事件類型）
- 時間間隔要自然（避免太規律）
- 名字要符合本地習慣

### 隱私保護
- 即使真實用戶，也應隱藏完整姓名
- 不顯示可識別的個人資訊

---

## 文件資訊

- **建立日期**: 2026-02-01
- **最後更新**: 2026-02-07
- **專案路徑**: `/Users/alan_dingchaoliao/Documents/網站開發/網站架設`
