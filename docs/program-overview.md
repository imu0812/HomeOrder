# 程式維護總覽

這份文件給後續維護者快速掌握系統邊界、核心流程與容易改壞的規則。若功能擴充後流程有變，請優先更新這份文件，再補充更細的規格文件。

## 系統定位

此專案是家用烘焙訂單與庫存管理系統，使用 Next.js App Router 建立前後端同 repo 的應用。現階段資料來源以 mock repository 為主，保留 Google Sheets repository 介面，讓後續可以替換資料層。

主要功能：

- 商品、包材、BOM 查詢
- 訂單新增、確認、退回 draft、void
- 訂單明細逐筆 fulfill
- confirmed 訂單中 pending 明細可編輯或取消
- 包材預留、釋放、扣庫與 shortagePackagings 檢查
- 出貨排程依 OrderItem 的 plannedFulfillDate 顯示

## 目錄責任

| 路徑 | 用途 |
| --- | --- |
| `src/app/(app)` | 後台頁面，包含 dashboard、orders、schedule、inventory、products、packagings |
| `src/app/api` | API route，將 HTTP request 轉給 service 層 |
| `src/components` | 共用 UI 與 domain component |
| `src/domain` | 核心 type、constant、Zod schema |
| `src/repositories` | 資料存取介面與 mock/sheets 實作 |
| `src/services` | 核心商業邏輯，訂單與庫存規則主要放這裡 |
| `src/lib/query` | React Query 快取與樂觀更新輔助 |
| `docs` | 維護文件與資料表模板 |

## 分層原則

頁面與 API route 只做輸入輸出轉接，商業規則應放在 service 層。後續新增功能時，請優先遵守：

- UI 只能做使用體驗限制，不能當唯一防線。
- API route 不直接操作 repository，應呼叫 service。
- service 負責檢查狀態、更新庫存、寫入交易紀錄、重算快照。
- repository 只處理資料讀寫，不放商業判斷。
- domain schema 負責 request payload 驗證。

## 核心資料模型

### Order

`Order` 表示整張訂單，目前狀態定義在 `src/domain/constants.ts`：

- `draft`：草稿，可確認，也可編輯 pending 明細。
- `confirmed`：已確認，會產生 OrderItemComponents 快照並預留包材。
- `cancelled`：已 void，不可再編輯。

金額欄位：

- `subtotalBeforeDiscount`
- `discountType`
- `discountRate`
- `discountAmount`
- `totalAmount`

金額重算集中在 `src/services/orderService.ts` 的 `calculateOrderAmounts` 與 `recalculateOrderTotals`。

### OrderItem

`OrderItem` 是訂單中的出貨/製作明細。每筆明細有自己的 `plannedFulfillDate`，排程頁以這個欄位分日顯示。

明細狀態：

- `pending`：尚未 fulfill，可編輯、可取消、可 fulfill。
- `fulfilled`：已完成，不可修改、不可刪除、不可取消。
- `cancelled`：已取消，不參與需求重算。

### OrderItemComponent

`OrderItemComponent` 是 confirm 或 pending 明細重算時產生的需求快照。它記錄每筆 OrderItem 展開後需要的商品或包材：

- `itemType`: `product` 或 `packaging`
- `itemId`
- `qty`
- `sourceType`: `single`、`product_bom`、`packaging_bom`、`custom_mix`

fulfilled 明細的快照代表已經發生或保留過的歷史，不應在 pending 明細修改時被重算覆蓋。

## 訂單狀態規則

核心邏輯在 `src/services/orderService.ts`。

### Confirm

入口：`confirmOrder`

條件：

- 只有 `draft` 訂單可以 confirm。
- 至少需要一筆明細。
- `cancelled` 明細不參與需求展開。

動作：

- 展開商品需求與包材需求。
- 寫入 OrderItemComponents。
- 只針對包材新增 reservedStock。
- 寫入 reserve transaction。
- 訂單狀態改為 `confirmed`。
- `shortagePackagings` 只回傳包材不足，不回傳 shortageProducts。

### Unconfirm

入口：`unconfirmOrder`

條件：

- 只有 `confirmed` 訂單可以退回 draft。
- 只要任一 OrderItem 是 `fulfilled`，整張訂單不得 unconfirm。

動作：

- 釋放目前快照中的包材預留。
- 清空 OrderItemComponents。
- 訂單狀態改為 `draft`。

### Void

入口：`voidOrder`

條件：

- `cancelled` 訂單不可重複 void。
- 只要任一 OrderItem 是 `fulfilled`，整張訂單不得 void。

動作：

- 若訂單是 `confirmed`，釋放包材預留。
- 將所有未 fulfilled 明細改為 `cancelled`。
- 清空 OrderItemComponents。
- 訂單狀態改為 `cancelled`。

### Fulfill OrderItem

入口：`fulfillOrderItem`

條件：

- 訂單必須是 `confirmed`。
- 只有 `pending` 明細可以 fulfill。

動作：

- 取得該 OrderItem 的包材快照。
- 從 reservedStock 扣除並同步扣 currentStock。
- 寫入 deduct transaction。
- 明細改為 `fulfilled`，寫入 `fulfilledAt`。

## Pending 明細編輯規則

入口：`updatePendingOrderItem`

API：

- `POST /api/orders/[id]/items`
- `PATCH /api/orders/[id]/items/[itemId]`
- `DELETE /api/orders/[id]/items/[itemId]`

允許修改：

- `qty`
- `plannedFulfillDate`
- `packagingId`
- `remark`
- `cancel`

硬限制：

- `cancelled` 訂單不可編輯。
- 只有 `draft` 訂單可以新增明細。
- 只有 `pending` 明細可以修改或取消。
- `fulfilled` 明細不可修改、不可刪除、不可取消。
- 取消明細時，若整張訂單只剩 1 筆有效明細，必須拒絕；使用者應改為刪除或 void 整張訂單。

confirmed 訂單中修改 pending 明細時，重算策略是：

1. 找出目前訂單所有 OrderItemComponents。
2. 保留 fulfilled 明細對應的快照。
3. 釋放非 fulfilled 明細既有包材預留。
4. 只針對目前仍是 pending 的明細重新展開需求。
5. 重新寫入「fulfilled 快照 + pending 新快照」。
6. 只針對 pending 新包材需求新增 reservedStock。
7. `shortagePackagings` 只根據 pending 新包材需求計算。

這是目前最重要的維護規則之一：fulfilled 是歷史鎖定，pending 是可變需求。

## 包材庫存與 transaction

庫存操作定義在 `src/repositories/interfaces.ts`：

- `addReservedStock`
- `releaseReservedStock`
- `deductReservedStock`

目前 service 層只對包材做預留與釋放。商品需求會展開給前端或檢視使用，但不做 product reservedStock。

transaction 類型：

- `reserve`：confirm 或 pending 重算後預留包材。
- `release`：unconfirm、void 或 pending 重算時釋放包材。
- `deduct`：fulfilled 明細扣除已預留包材。

## API 對照

| API | Method | Service | 說明 |
| --- | --- | --- | --- |
| `/api/orders` | GET | `listOrderItemsSummary` | 訂單列表摘要 |
| `/api/orders` | POST | `createMockOrderFromTemplate` | 新增訂單 |
| `/api/orders/[id]` | GET | `getOrderDetail` | 訂單詳情 |
| `/api/orders/[id]/confirm` | POST | `confirmOrder` | confirm 並預留包材 |
| `/api/orders/[id]/unconfirm` | POST | `unconfirmOrder` | 退回 draft |
| `/api/orders/[id]/void` | POST | `voidOrder` | void 整張訂單 |
| `/api/orders/[id]/items` | POST | `addDraftOrderItem` | 新增 draft 訂單明細 |
| `/api/orders/[id]/items/[itemId]/fulfill` | POST | `fulfillOrderItem` | fulfill 單筆明細 |
| `/api/orders/[id]/items/[itemId]` | PATCH | `updatePendingOrderItem` | 編輯 pending 明細 |
| `/api/orders/[id]/items/[itemId]` | DELETE | `updatePendingOrderItem` | 取消 pending 明細 |
| `/api/schedule` | GET | `listScheduleItems` | 依日期查詢排程 |

`cancel` 與 `ship` 舊路由目前保留為停用提示，避免舊入口被誤用。

## 前端互動重點

訂單詳情頁：`src/app/(app)/orders/[id]/order-detail-client.tsx`

- Confirm 使用 `ConfirmOrderDialog`。
- fulfilled 存在時，unconfirm/void 按鈕會 disabled。
- draft 訂單可新增明細。
- pending 明細顯示編輯與取消按鈕。
- 若只剩 1 筆有效明細，取消按鈕會 disabled。
- fulfilled/cancelled 明細不提供編輯、取消、fulfill 操作。
- 明細更新後會 invalidate order、orders、schedule 相關 query。

排程頁：

- 只列 confirmed 訂單。
- 依 OrderItem 的 `plannedFulfillDate` 顯示。

## Mock 資料

mock DB 在 `src/repositories/mock/mockData.ts`。目前重要測試資料：

- `o_multiday`：含一筆 fulfilled 與一筆 pending 明細，用來驗證 partial fulfillment 規則。
- `o_shortage`：用來驗證 confirm shortagePackagings。

若新增狀態規則，建議先在 mockData 增加最小案例，再補 service 測試。

## 驗證方式

常用指令：

```powershell
npx tsc --noEmit
npm run build
npm run dev
```

已知注意事項：

- Windows 上可能看到 `@next/swc-win32-x64-msvc ... is not a valid Win32 application` warning。Next 會 fallback 到 wasm；只要 build/dev 繼續成功，就不是阻塞錯誤。
- 若 `npm run dev` 出現 `.next\trace` EPERM，通常是另一個 Next dev process 還在跑或 `.next` 被鎖住。先停掉舊 node process，再必要時刪除 `.next`。

## 修改核心流程前的檢查清單

修改訂單、庫存、排程相關程式前，請至少確認：

- 是否會影響 fulfilled 明細鎖定規則。
- 是否會讓 fulfilled 快照被 pending 重算覆蓋。
- 是否只對 pending 明細計算新的 shortagePackagings。
- 是否有正確釋放舊 reservedStock，再新增新的 reservedStock。
- 是否新增對應 transaction，方便追蹤庫存變化。
- 是否 invalidate 相關 React Query cache。
- 是否補 service 層測試，而不是只測 UI。

## 後續建議

- 將目前文字亂碼訊息整理為一致的繁體中文。
- 為 service 測試補上 package script，例如 `npm run test:services`。
- 完成 Google Sheets repository 實作前，先確認 Sheets schema 與 `src/domain/types.ts` 完全對齊。
- 若未來要支援整張訂單實體刪除，必須沿用 void 的 fulfilled guard，且不得刪除 fulfilled 歷史。

## 商品管理與 BOM

商品管理目前支援新增與修改商品基本資料，入口是 `/products`。
商品也可以刪除，但刪除前必須檢查使用關係：

- 若商品已出現在任何訂單主明細，不能刪除。
- 若商品已出現在任何訂單自訂組合內容，不能刪除。
- 若商品已被其他商品 BOM 作為子商品使用，不能刪除。
- 若商品未被使用，可以刪除；刪除商品時會一併移除該商品自己的 BOM 與 mock 商品庫存資料。

商品 BOM 入口是 `/products/[id]/bom`，用來維護固定組合或配方型商品的子商品與數量。訂單 confirm 時，`bundle` 類商品會依 `ProductBOMItem` 展開需求。

請注意：

- 固定組合商品的內容應維護在 Product BOM。
- 訂單詳情下方的「組合內容」是 `OrderMixItem`，只用來顯示 `custom_bundle_template` 這類客製混搭明細。
- 不要把固定組合內容寫進 OrderMixItem，否則商品管理和訂單需求展開會失去一致來源。

相關 API：

| API | Method | Service | 說明 |
| --- | --- | --- | --- |
| `/api/products` | POST | `createProduct` | 新增商品 |
| `/api/products/[id]` | PATCH | `updateProduct` | 修改商品 |
| `/api/products/[id]` | DELETE | `deleteProduct` | 刪除未被使用的商品 |
| `/api/products/[id]/bom` | PUT | `replaceProductBom` | 整批儲存商品 BOM |

## 包材管理與 BOM

包材管理目前支援新增、修改與刪除包材基本資料，入口是 `/packagings`。

包材 BOM 入口是 `/packagings/[id]/bom`，用來維護組合包材的子包材與數量。訂單 confirm 時，若訂單明細選用的包材是組合包材，會依 `PackagingBOMItem` 展開成子包材需求。

包材刪除前必須檢查使用關係：

- 若包材已出現在任何訂單明細的 `packagingId`，不能刪除。
- 若包材已出現在任何訂單快照 `OrderItemComponent`，不能刪除。
- 若包材已被其他包材 BOM 作為子包材使用，不能刪除。
- 若包材未被使用，可以刪除；刪除包材時會一併移除該包材自己的 BOM 與 mock 包材庫存資料。

相關 API：

| API | Method | Service | 說明 |
| --- | --- | --- | --- |
| `/api/packagings` | POST | `createPackaging` | 新增包材 |
| `/api/packagings/[id]` | PATCH | `updatePackaging` | 修改包材 |
| `/api/packagings/[id]` | DELETE | `deletePackaging` | 刪除未被使用的包材 |
| `/api/packagings/[id]/bom` | PUT | `replacePackagingBom` | 整批儲存包材 BOM |
