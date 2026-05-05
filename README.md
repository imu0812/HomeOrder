# HomeOrder

家用烘焙訂單與庫存管理系統。此專案使用 Next.js App Router，前端頁面、API route、service 商業邏輯與 repository 資料存取介面放在同一個 repo。

## 維護文件

- [程式維護總覽](docs/program-overview.md)
- [Google Sheets 資料表模板](docs/google-sheets-template.md)

## 開發指令

```powershell
npm run dev
npm run dev:warmup
npm run dev:turbo
npx tsc --noEmit
npm run build
```

`npm run dev` 使用穩定的 Next webpack dev server。開啟 dev server 後可在另一個終端機執行 `npm run dev:warmup`，先預熱常用頁面與 API，減少第一次點頁面的等待。

`npm run dev:turbo` 保留給可載入 native SWC/Turbopack binding 的環境；若出現 `turbo.createProject is not supported by the wasm bindings`，請改用 `npm run dev`。

## 核心規則

訂單與庫存規則集中在 `src/services/orderService.ts`。UI 與 API route 不應作為唯一防線；新增或調整訂單流程時，請優先更新 service 層與 `docs/program-overview.md`。
