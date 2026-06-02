# OHCA 現場計時器 — 戰術儀表板 Tactical HUD

一款離線優先的漸進式網頁應用程式（PWA），協助單一施救者在現場為**到院前心臟
停止（OHCA）**的急救過程計時與紀錄。它採用高對比的「戰術儀表板」介面，提供大
而易讀的計時器、一鍵動作紀錄、給藥間隔提醒，以及即時治療時間軸，全部在裝置本
機執行，完全不需要網路。

🌐 **線上應用程式：** https://swim-fish.github.io/ohca-field-timer/

For the English version, see [README.md](./README.md).

> [!WARNING]
> **本軟體並非經認證的醫療器材。** 它是計時與紀錄的輔助工具。給藥間隔、CPR 循
> 環長度與心律判讀皆沿用參考設計的預設值，**不能取代臨床判斷、在地流程或 ACLS
> 訓練**。操作者須為所有臨床決策，以及裝置上儲存的病患資料負責。

## 功能特色

- **主案件計時器** — 應用程式一開啟即自動起算，以 `mm:ss` 向上計時（超過 60
  分鐘自動延伸為時數），且可調整起始時間以回填實際的心臟停止時刻，所有事件的
  時間偏移會隨之重新計算。
- **CPR 循環計時器** — 2 分鐘按壓倒數，附循環次數、進度條、最後 15 秒的明顯警
  示，以及自動進入下一循環。
- **給藥間隔提醒** — 一鍵紀錄 Epinephrine（3 分鐘）與 Amiodarone（4 分鐘）給
  藥，維持累計次數，並在間隔到期時以脈動標示「可給藥」。
- **去顫電擊** — 以可選擇的能量等級（150 / 200 / 250 / 300 / 360 J）紀錄電擊，
  並即時累計電擊次數。
- **臨床紀錄** — 判讀心律（VF / pVT / PEA / Asystole / ROSC）並標示可電擊心
  律、呼吸道裝置與氣管內管尺寸、IV/IO 管路建立，以及透過適合戴手套操作的數字
  鍵盤輸入生命徵象，並自動推算平均動脈壓（MAP）。
- **即時治療時間軸** — 反向時序的紀錄，每筆顯示時刻與經過時間；長按可刪除誤觸
  的紀錄，所有摘要計數器皆保持一致（單一資料來源）。
- **里程碑與重置** — 宣告 ROSC 與到院（主計時器持續運作）；經明確確認後可開始
  新案件。
- **離線與可安裝** — 首次載入後即可完全離線運作、可安裝至主畫面，並在重新載入
  或重新啟動後還原進行中的案件。
- **日／夜模式** — 預設為高對比的深色「指揮中心」風格，並提供淺色模式切換。

所有面向使用者的介面文字皆為繁體中文（zh-Hant），與現場設計一致。

## 技術堆疊

- **TypeScript**（strict）+ **React 18** + **Vite**
- **vite-plugin-pwa** — 離線優先的 service worker、可安裝的 manifest
- **localStorage** — 裝置本機的案件持久化（無伺服器、無帳號、無同步）
- **Vitest** + **React Testing Library** — TDD 單元與元件測試
- **Prettier** — 程式碼格式化
- 透過 GitHub Actions 部署至 **GitHub Pages**

## 開始使用

需要 Node.js 20 以上版本。

```bash
npm install        # 安裝相依套件
npm run dev        # 啟動 Vite 開發伺服器
```

### 常用指令

| 指令                   | 說明                                       |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | 啟動具熱重載的開發伺服器                   |
| `npm run build`        | 型別檢查（`tsc --noEmit`）並建置至 `dist/` |
| `npm run preview`      | 在本機預覽正式環境建置                     |
| `npm run test`         | 以 watch 模式執行 Vitest                   |
| `npm run test:run`     | 執行一次完整測試                           |
| `npm run coverage`     | 執行測試並產生涵蓋率報告                   |
| `npm run format`       | 以 Prettier 格式化整個程式碼庫             |
| `npm run format:check` | 驗證格式（CI 使用）                        |

## 專案結構

```
src/
  App.tsx              # 應用程式最上層外殼與版面
  components/          # 戰術儀表板介面（磚塊、時間軸、選擇器、鍵盤……）
  domain/              # 純邏輯：型別、常數、衍生計算、格式化、useOHCA hook
  persistence/         # localStorage 案件儲存
  theme/               # 設計 token 與日／夜主題
  styles/              # 全域樣式
tests/                 # Vitest 單元與元件測試
specs/                 # 功能規格、計畫與設計參考（單一事實來源）
```

## 部署

推送至 `main` 會觸發 **Deploy to GitHub Pages** workflow
（`.github/workflows/deploy.yml`），它會檢查格式、執行測試、建置，最後發布至
GitHub Pages。Vite 的 `base` 設為 `/ohca-field-timer/` 以對應 Pages 路徑。

## 隱私

所有資料皆保留在裝置本機。沒有帳號、登入、後端或雲端同步。進行中的案件會保存
於本機，直到開始新案件或手動清除紀錄為止——清除紀錄是操作者為保護裝置本機隱私
應負的責任。

## 授權

以 [MIT License](./LICENSE) 釋出。
