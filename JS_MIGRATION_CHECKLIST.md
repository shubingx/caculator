# index.html 內嵌 JavaScript 搬移清單

目的：把 `index.html` 最底部約 2,500 行的 `<script>` 內容，依 `PROJECT_STRUCTURE.md` 的分層搬進 `src/`，最後讓 `index.html` 只保留 HTML 骨架。

> 狀態標記：`[ ]` 尚未搬移　`[~]` `src/` 已有空殼或部分實作，需合併　`[x]` 已完成

---

## 0. 搬移前須知

- inline 腳本目前**透過 `onclick="..."` 直接呼叫全域函式**。搬出後有兩條路：
  - 過渡期：在模組末端加 `window.xxx = xxx`（與 `toast.js`、`formatters.js` 現況相同）。
  - 最終：把 `onclick` 改成 `addEventListener` / `data-action`，不再掛 `window`。
- inline 腳本與 `src/` 之間已有的隱性依賴：
  - `src/domain/lp-solver.js` 呼叫 `window.solveFullLPModel`（方向相反，搬完求解器後要改為直接 import）。
  - inline 的 `draw2DGraph` 呼叫 `window.clipPolygonByHalfPlane`（來自 `geometry.js`）。
  - inline 使用 `showToast`、`fmtNum`、`subDigit`、`formatLinearExpression`（來自 `src/ui/`）。
- 建議每搬完一個區塊就手動操作一次畫面（載入範例 → 求解 → 切換頁籤），確認沒有回歸。

---

## 1. 全域狀態

| 變數 | 內容 | 目標位置 | 狀態 |
|---|---|---|---|
| `lpState` | 一般 LP 目前模型 | `src/app/app-state.js` | [ ] |
| `lastSolution` | 最近一次求解結果 | `src/app/app-state.js` | [ ] |
| `tpState` | 運輸問題狀態 | `src/app/app-state.js` | [ ] |
| `guidedScenario` | 目前選的題型 | `src/app/app-state.js` | [ ] |
| `guidedTransportFormState` | 引導式運輸表單狀態 | `src/features/onboarding/` 內部狀態 | [ ] |

注意：`navigation.js` 的 `navigateSidebar` 引用了 `guidedScenario`，但它並未定義，狀態集中後要一併處理。

---

## 2. 工具函式

| 函式 | 目標位置 | 狀態 |
|---|---|---|
| `escapeHtml` | `src/ui/dom.js`（或 `formatters.js`） | [ ] |
| `showToast` | `src/ui/toast.js` | [x] |
| `fmtNum`、`subDigit`、`formatLinearExpression` | `src/ui/formatters.js` | [x] |

---

## 3. 求解器（優先度最高）

| 函式 | 目標位置 | 狀態 |
|---|---|---|
| `solveContinuousLP`（含內部 `runSimplexPhase`） | `src/domain/lp-solver.js` | [~] 目前只是轉呼叫 `window.solveContinuousLP` |
| `solveFullLPModel`（含分支界限） | `src/domain/integer-solver.js` | [~] 目前轉呼叫 `window.solveFullLPModel` |

搬移重點：
- 改成純函式，不使用 `window`、`document`。
- `lp-solver.js` 改為直接 import `integer-solver.js`，移除 `window` 轉接。
- 分支界限的 `MAX_NODES = 250` 截斷時，回傳 `truncated: true` 旗標。
- 搬完後立刻補測試：講義範例（`max 20x₁+15x₂`，期望 `x=(5,10)`、`Z*=250`）、無可行解、無界解、整數範例、影子價格。

---

## 4. 一般 LP 功能

### 4-1 輸入與模型預覽 → `src/features/general-lp/`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `setProblemType` | Max / Min 切換 | [ ] |
| `changeVarCount`、`setVarCount` | 變數數量調整 | [ ] |
| `renderAllGeneralLPInputs` | 渲染變數、目標函數、限制式 | [ ] |
| `renderConstraintsList` | 渲染限制式列表 | [ ] |
| `addConstraint`、`removeConstraint` | 新增／刪除限制式 | [ ] |
| `updateModelState` | 同步目標單位 | [ ] |
| `renderLiveMathModel` | 即時數學模型預覽 | [ ] |
| `copyMathModel` | 複製模型文字 | [ ] |
| `resetLPForm` | 清空重設 | [ ] |

建議拆成 `general-lp-view.js`（渲染）與 `general-lp-controller.js`（事件／流程）。

### 4-2 求解結果顯示 → `src/features/analysis/results-view.js`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `solveCurrentLP` | 呼叫求解器並渲染 Z\*、變數卡片、管理意涵、限制式表、敏感度說明、錯誤框 | [~] `results-view.js` 目前只有簡略摘要 |

`solveCurrentLP` 很長，建議拆成：取得結果、渲染 infeasible／unbounded、渲染最佳解、渲染限制式表、渲染敏感度筆記。

### 4-3 圖形分析 → `src/features/analysis/graph-view.js`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `draw2DGraph` | Canvas 繪製可行域、限制線、等值線、端點、最佳點 | [~] `graph-view.js` 只有 `buildFeasiblePolygon` |
| `legacyClipPolygonByHalfPlane` | 舊版多邊形裁切 | [ ] 直接刪除，已由 `geometry.js` 取代 |

拆分建議：端點計算（`allLines` 求交點、可行性檢查）移到 `src/domain/geometry.js`，Canvas 繪製留在 view。

---

## 5. 範例與範本資料

| 內容 | 目標位置 | 狀態 |
|---|---|---|
| `loadPreset` 內各預設題（`hw_default`、`min_cost`、`sensitivity_demo`、`three_vars`、`integer_demo`、`infeasible`、`unbounded`） | `src/data/presets.js` | [~] 目前只有 key 清單 |
| `loadTemplateModel` 內各範本（`assignment`、`blending`、`production`） | `src/data/templates.js` | [~] 目前只有 key 清單 |
| `loadTransportPreset` 內 `pdf_example`、`unbalanced` | `src/data/presets.js` 或 `src/data/transport-presets.js` | [ ] |
| `guidedScenarioData`（標題、描述、問題） | `src/data/guided-scenarios.js` | [~] 目前只有 model／objective 對照 |

搬移重點：資料與「載入後呼叫 render／solve」的流程分開，函式只負責套用資料。

---

## 6. 運輸問題 → `src/features/transport/`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `loadTransportPreset` | 載入範例 | [ ] |
| `resizeTransportMatrix` | 調整供需地數量 | [ ] |
| `updateTPBalanceBanner` | 供需平衡提示 | [ ] |
| `renderTransportInputTable` | 渲染成本矩陣輸入表 | [ ] |
| `generateTransportLPModelObject` | 轉成 LP 模型 | [~] 與 `domain/transport-model.js` 的 `createTransportModel` 重複，約束名稱不同（`供給限制` vs `供應`），需統一 |
| `buildAndSolveTransport` | 渲染數學模型、求解、路線表、矩陣、供需分析 | [ ] |
| `syncTransportToGeneralLP` | 同步到一般 LP 編輯器 | [ ] |

注意：`buildAndSolveTransport` 以索引 `sol.constraints[i]` 對應供給／需求限制式，搬移時要保持限制式順序（先供給、後需求）。

---

## 7. 引導式選題（Onboarding）→ `src/features/onboarding/`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `startGuidedScenario`、`resetGuidedPicker` | 選題與重設 | [ ] |
| `renderGuidedForm` | 依題型渲染表單 | [ ] |
| `guidedProductRow` | **在 inline 中定義了 3 次，只有最後一次生效**，搬移時只保留最後一版 | [ ] |
| `guidedResourceRow` | **定義了 2 次**，只保留最後一版 | [ ] |
| `addGuidedProduct`、`removeGuidedProduct` | 商品列增刪 | [ ] |
| `solveGuidedForm` | 引導式一般 LP 求解 | [ ] |
| `showGuidedResult` | 顯示結果卡片 | [ ] |
| `renderGuidedTransportForm` | 引導式運輸表單 | [ ] |
| `updateGuidedTransportField`、`updateGuidedTransportCost` | 欄位更新 | [ ] |
| `addGuidedTransportLocation`、`removeGuidedTransportLocation` | 供需地增刪 | [ ] |
| `solveGuidedTransportForm` | 引導式運輸求解 | [ ] |
| `useGuidedExample` | 用範例開始（內有重複且永遠不會執行的 `transport` 分支，搬移時刪除） | [ ] |

`model-metadata.js`（`getModelDisplayName`）已完成，但其名稱表與 `guided-scenarios.js` 為兩份平行資料，建議合併成單一來源。

---

## 8. 導覽與頁籤 → `src/app/`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `switchMainTab` | 切換 general／transport／templates 視圖 | [ ] 建議放 `src/app/routes.js` |
| `navigateSidebar` | inline 與 `navigation.js` **各有一份且行為不同** | [~] 擇一保留：inline 版依 `guidedScenario` 判斷，`navigation.js` 版依 `view-transport` 是否可見；`navigation.js` 版未 export／掛到 `window` 且引用未定義變數，目前為死碼 |
| `setWorkspaceNavigationVisible`、`setSidebarActive`、`showGuidedInputPage`、`showOnboardingPage`、`toggleAdvancedTools`、`openGuidedEditor`、`syncSidebarToScroll` | 側邊欄與首頁 | [x] 已在 `navigation.js` |

---

## 9. AI 解析與範本 → `src/features/ai-parser/`、`src/features/templates/`

| 函式 | 說明 | 狀態 |
|---|---|---|
| `fillAIPromptSample` | 填入範例文字 | [ ] |
| `parseNaturalLanguageToLP` | 以正規表示式解析文字並建立模型 | [~] `parser.js` 僅有簡化版（只判斷 min/max 與是否含 x1、x2），需把 inline 的限制式／係數解析整段搬入 |
| `loadTemplateModel` | 載入範本並求解 | [~] `template-controller.js` 只是轉呼叫 `window.loadTemplateModel` |

---

## 10. 初始化與全域事件 → `src/main.js`

| 內容 | 說明 | 狀態 |
|---|---|---|
| `window.addEventListener('resize', ...)` | 重繪 2D 圖 | [ ] |
| `window.onload = function () {...}` | 初始渲染一般 LP、運輸表格、顯示 onboarding、隱藏其他視圖 | [ ] |
| `tailwind.config = {...}` | Tailwind CDN 設定，可留在 `index.html` 或獨立成 `tailwind-config.js` | [ ] |

`main.js` 目前只設定 `dataset.appReady`，搬完後應負責呼叫上述初始化。

---

## 11. `index.html` 其他非 JS 的清理（搬移時一併處理）

- `<style>` 內大量覆寫規則 → 併入 `src/styles/base.css`、`layout.css`、`components.css`（目前兩邊重複定義 `.workspace-*`、`.glass-card` 等）。
- 被 CSS `display:none` 隱藏的舊結構：`#legacy-main-tabs`、`.preset-quick-actions`（`#view-general > .glass-card:first-child`），確認無用後直接從 HTML 移除。
- `switchMainTab` 仍會讀取 `tab-btn-general` 等舊頁籤按鈕，移除 `#legacy-main-tabs` 前須先改掉此處。
- 刪除空檔 `caculater.onesource`；專案名 `caculater` 可考慮更正為 `calculator`。

---

## 12. 建議搬移順序

1. **求解器**（第 3 節）＋補測試。
2. **刪除死碼與重複**：`legacyClipPolygonByHalfPlane`、`guidedProductRow` ×2、`guidedResourceRow` ×1、`useGuidedExample` 的重複分支、`navigateSidebar` 其一。
3. **資料**（第 5 節）搬到 `src/data/`。
4. **全域狀態**（第 1 節）集中到 `app-state.js`。
5. **運輸問題**（第 6 節）：與 `domain/transport-model.js` 合併。
6. **一般 LP 輸入與結果／圖形**（第 4 節）。
7. **引導式選題**（第 7 節）、**AI 解析與範本**（第 9 節）。
8. **導覽與初始化**（第 8、10 節），並把 `onclick` 改為事件監聽。
9. **精簡 `index.html`**，只保留骨架與 `<script type="module" src="./src/main.js">`。
10. 在 `package.json` 加入 dev server（`file://` 無法載入 ES module）。

---

## 13. 驗收檢查表

- [ ] `index.html` 內不再有大型 inline `<script>`（Tailwind 設定除外）。
- [ ] `src/domain/` 內沒有 `window`、`document`。
- [ ] 求解器有單元測試（最佳解、infeasible、unbounded、整數、影子價格）。
- [ ] 所有 `onclick` 已改為事件監聽，或確認過渡期的 `window.*` 清單。
- [ ] 7 個預設題、3 個範本、2 個運輸範例、5 個引導題型皆可正常載入與求解。
- [ ] 2 變數時 2D 圖正常繪製；非 2 變數時圖卡片隱藏。
- [ ] `npm test` 全數通過。
 
  