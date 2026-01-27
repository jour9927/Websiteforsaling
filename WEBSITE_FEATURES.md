# 活動報名與抽獎網站 - 功能清單

## 技術棧
- **前端框架**: Next.js 14 (App Router) + TypeScript
- **樣式**: Tailwind CSS + Glassmorphism 視覺風格
- **後端/資料庫**: Supabase (PostgreSQL + Auth + Storage)
- **部署**: Vercel (自動 CI/CD)
- **Git**: https://github.com/jour9927/Websiteforsaling

---

## 資料庫結構 (Supabase PostgreSQL)

### 主要資料表
| 資料表 | 用途 |
|--------|------|
| `profiles` | 使用者資料 (含 role 欄位區分 admin/user) |
| `events` | 活動資訊 |
| `registrations` | 報名紀錄 |
| `announcements` | 公告 |
| `draw_results` | 抽獎結果 |
| `user_items` | 使用者商品/獎品 |
| `user_payments` | 付款紀錄 |
| `user_deliveries` | 配送紀錄 |
| `messages` | 訊息系統 |
| `notifications` | 通知系統 |

### Events 資料結構
```typescript
{
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  price?: number;
  status: 'draft' | 'published' | 'closed';
  image_position?: string;
  created_at: string;
}
```

### Registrations 資料結構
```typescript
{
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  registered_at: string;
}
```

---

## 頁面路由結構

### 公開頁面 (無需登入)
| 路徑 | 功能 |
|------|------|
| `/` | 首頁 - 顯示活動列表 |
| `/events` | 活動列表頁 |
| `/events/[id]` | 活動詳情頁 |
| `/announcements` | 公告列表頁 |
| `/announcements/[id]` | 公告詳情頁 |
| `/login` | 登入頁 |
| `/signup` | 註冊頁 (支援邀請碼) |
| `/privacy` | 隱私政策頁 |

### 會員專屬頁面 (需登入)
| 路徑 | 功能 |
|------|------|
| `/profile` | 個人資料管理 |
| `/history` | 報名歷史紀錄 |
| `/messages` | 訊息中心 |
| `/payments` | 我的付款紀錄 |
| `/deliveries` | 配送狀態查詢 |
| `/items` | 我的商品/獎品 |
| `/logout` | 登出 |

### 管理後台 (需 admin 權限)
| 路徑 | 功能 |
|------|------|
| `/admin` | 後台儀表板 |
| `/admin/events` | 活動管理 (CRUD) |
| `/admin/events/[id]` | 編輯活動 |
| `/admin/registrations` | 報名管理 |
| `/admin/registrations/[id]` | 報名詳情/審核 |
| `/admin/announcements` | 公告管理 |
| `/admin/announcements/[id]` | 編輯公告 |
| `/admin/messages` | 訊息管理 |
| `/admin/notifications` | 通知管理 |
| `/admin/payments` | 付款管理 |
| `/admin/deliveries` | 配送管理 |
| `/admin/items` | 商品管理 |

---

## API 端點

### 活動相關
| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/events` | 取得活動列表 |
| POST | `/api/events` | 建立活動 (管理員) |
| GET | `/api/events/[id]` | 取得單一活動 |
| PUT | `/api/events/[id]` | 更新活動 (管理員) |
| DELETE | `/api/events/[id]` | 刪除活動 (管理員) |
| POST | `/api/events/[id]/register` | 報名活動 |
| POST | `/api/events/[id]/draw` | 執行抽獎 (管理員) |

### 使用者相關
| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/me/profile` | 取得個人資料 |
| GET | `/api/me/history` | 取得報名歷史 |

### 管理員 API
| 方法 | 路徑 | 功能 |
|------|------|------|
| GET/POST | `/api/admin/payments` | 付款管理 |
| PUT | `/api/admin/payments/[id]` | 更新付款狀態 |
| GET | `/api/admin/payments/users` | 取得使用者列表 |
| GET/POST | `/api/admin/deliveries` | 配送管理 |
| PUT | `/api/admin/deliveries/[id]` | 更新配送狀態 |
| GET/POST | `/api/admin/items` | 商品管理 |
| PUT | `/api/admin/items/[id]` | 更新商品 |
| PUT | `/api/admin/registrations/[id]/status` | 更新報名狀態 |
| PUT | `/api/admin/registrations/[id]/time` | 更新報名時間 |
| POST | `/api/admin/registrations/create` | 建立離線報名 |

---

## 功能模組詳細說明

### 1. 會員系統
- **註冊**: 使用 Supabase Auth，支援邀請碼機制
- **登入/登出**: Email + Password 驗證
- **角色區分**: 普通會員 (user) / 管理員 (admin)
- **個人資料**: 可編輯姓名等基本資訊

### 2. 活動管理
- **建立活動**: 標題、描述、日期、價格、最大人數
- **圖片上傳**: 支援活動封面圖片 (Supabase Storage)
- **圖片位置調整**: 可設定封面圖片的顯示位置
- **狀態管理**: 草稿 → 發布 → 關閉
- **報名功能**: 登入會員可報名活動
- **抽獎功能**: 管理員可對報名者執行抽獎

### 3. 報名管理
- **報名審核**: pending → confirmed / cancelled
- **離線報名**: 管理員可手動新增報名
- **報名時間編輯**: 可修改報名時間戳記
- **報名歷史**: 使用者可查看自己的報名紀錄

### 4. 公告系統
- **發布公告**: 標題 + 內容
- **公告列表**: 公開可見
- **管理功能**: 新增/編輯/刪除

### 5. 付款系統
- **付款紀錄**: 追蹤使用者付款狀態
- **狀態更新**: 管理員可更新付款狀態
- **使用者查詢**: 使用者可查看自己的付款紀錄

### 6. 配送系統
- **配送管理**: 追蹤商品配送進度
- **狀態更新**: 管理員更新配送狀態
- **使用者查詢**: 使用者可追蹤配送狀態

### 7. 商品/獎品管理
- **商品指派**: 管理員可指派商品給使用者
- **商品查詢**: 使用者可查看擁有的商品

### 8. 訊息系統
- **訊息傳送**: 使用者與管理員之間的溝通
- **訊息管理**: 管理員可查看/回覆所有訊息

### 9. 通知系統
- **系統通知**: 管理員可發送通知給使用者

---

## UI 元件

### 共用元件
| 元件 | 位置 | 功能 |
|------|------|------|
| `SiteHeader` | `components/SiteHeader.tsx` | 全站導航列 (響應式) |
| `EventCard` | `components/EventCard.tsx` | 活動卡片展示 |
| `MemberOnlyBlock` | `components/MemberOnlyBlock.tsx` | 會員專屬內容區塊 |
| `MaintenanceBanner` | `components/MaintenanceBanner.tsx` | 維護公告橫幅 |

### 管理後台元件
| 元件 | 功能 |
|------|------|
| `AdminSidebar` | 後台側邊導航 |
| `AddRegistrationForm` | 新增報名表單 |
| `AddPaymentForm` | 新增付款表單 |
| `AddDeliveryForm` | 新增配送表單 |
| `RegistrationList` | 報名列表 |
| `EditRegistrationTimeModal` | 編輯報名時間 Modal |
| `ImagePositionEditor` | 圖片位置編輯器 |
| `UserPaymentRow` | 付款列表行 |
| `UserDeliveryRow` | 配送列表行 |
| `UserItemRow` | 商品列表行 |

---

## 安全機制

### Row Level Security (RLS)
- 所有資料表都啟用 RLS
- 使用者只能存取自己的資料
- 管理員可存取所有資料

### 權限檢查
- 客戶端: 導航列根據角色顯示不同選項
- 伺服器端: API Route 檢查 session 和 role
- 管理後台: 需要 admin role 才能存取

---

## 資料庫遷移檔案清單

位於 `supabase/migrations/`:
1. `001_initial_schema.sql` - 初始架構
2. `002_add_event_fields.sql` - 活動欄位擴充
3. `003_add_image_urls.sql` - 圖片 URL 欄位
4. `004_offline_registrations.sql` - 離線報名支援
5. `005_add_event_price.sql` - 活動價格欄位
6. `006_storage_policies.sql` - Storage 權限設定
7. `007_notifications_and_messages.sql` - 通知與訊息系統
8. `008_add_invitation_code.sql` - 邀請碼功能
9. `009_fix_messages_rls.sql` - 修復訊息 RLS
10. `010_fix_registrations_rls.sql` - 修復報名 RLS
11. `011_user_items.sql` - 使用者商品表
12. `012_add_payments.sql` / `012_user_payments.sql` - 付款系統
13. `013_user_deliveries.sql` - 配送系統
14. `014_fix_admin_registration_update.sql` - 管理員報名更新修復
15. `015_admin_create_registrations.sql` - 管理員建立報名
16. `016_add_image_position.sql` - 圖片位置欄位
17. `017_fix_events_update_policy.sql` - 活動更新權限修復
18. `018_fix_announcements_policies.sql` - 公告權限修復
19. `019_fix_registrations_select_policy.sql` - 報名查詢權限修復

---

## 環境變數

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 目前狀態

- ✅ 部署於 Vercel
- ✅ Supabase 資料庫已設定
- ✅ 所有功能已實作並運作中
- 🔧 目前顯示維護公告 (2.0 升級中，預計 96 小時)
