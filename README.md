# HomeOrder

家用烘焙訂單與庫存管理系統。此專案使用 Next.js App Router，前端頁面、API route、service 商業邏輯與 repository 資料存取介面放在同一個 repo。

## 維護文件

- [程式維護總覽](docs/program-overview.md)
- [Google Sheets 資料表模板](docs/google-sheets-template.md)

## 開發指令

```powershell
npm run dev
npx tsc --noEmit
npm run build
```

## 核心規則

訂單與庫存規則集中在 `src/services/orderService.ts`。UI 與 API route 不應作為唯一防線；新增或調整訂單流程時，請優先更新 service 層與 `docs/program-overview.md`。
