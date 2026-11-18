# 專案結構設計

## 1. 目前狀態

目前專案只有一個約 3,700 行的 [index.html](./index.html)，同時包含：

- 頁面 HTML 結構
- Tailwind CDN 與全域 CSS
- 導覽、選題引導與提示訊息
- 一般線性規劃模型編輯器
- 運輸問題模型
- LP 求解器與整數／二元變數處理
- 圖形分析
- AI 自然語言解析
- 管理科學範本

這種結構可以快速製作原型，但修改一個功能時需要在同一個檔案中尋找標記、樣式與 JavaScript，容易造成相依關係不清楚，也不利於測試。

## 2. 建議目標結構

第一階段先維持原生 JavaScript，不急著導入 React 或其他框架。這能保留目前的互動流程，並把責任拆開。

```text
caculater/
├─ index.html                    # 最小頁面骨架與根節點
├─ package.json                  # 開發伺服器、格式化與測試指令
├─ README.md
├─ PROJECT_STRUCTURE.md
├─ public/
│  └─ assets/                    # 不需經過模組打包的圖示或靜態資源
├─ src/
│  ├─ main.js                    # 應用程式入口、初始化與事件註冊
│  ├─ app/
│  │  ├─ app-state.js            # 導覽與目前選題狀態
│  │  ├─ routes.js               # onboarding/general/transport/templates 視圖切換
│  │  └─ toast.js                # Toast 顯示與關閉
│  ├─ styles/
│  │  ├─ base.css                # 全域 reset、字體、捲軸與色彩變數
│  │  ├─ layout.css              # header、workspace、sidebar、響應式排版
│  │  └─ components.css          # card、button、model banner 等元件樣式
│  ├─ domain/
│  │  ├─ lp-model.js             # LP 模型資料結構與驗證
│  │  ├─ lp-solver.js            # 連續 LP、Simplex Phase 1/2
│  │  ├─ integer-solver.js       # 整數與 0-1 分支定界
│  │  ├─ transport-model.js      # 運輸模型轉換與平衡檢查
│  │  └─ geometry.js             # 可行域裁切與 2D 圖形資料
│  ├─ data/
│  │  ├─ guided-scenarios.js     # allocation/cost/transport 等選題資料
│  │  ├─ presets.js              # 一般 LP 預設題目
│  │  └─ templates.js            # assignment/blending/production 範本
│  ├─ features/
│  │  ├─ onboarding/
│  │  │  ├─ onboarding-view.js   # 題型選擇與引導表單
│  │  │  └─ onboarding-controller.js
│  │  ├─ general-lp/
│  │  │  ├─ general-lp-view.js   # 變數、限制式與目標函數輸入
│  │  │  └─ general-lp-controller.js
│  │  ├─ transport/
│  │  │  ├─ transport-view.js
│  │  │  └─ transport-controller.js
│  │  ├─ analysis/
│  │  │  ├─ results-view.js      # 解答、Binding、Shadow Price
│  │  │  └─ graph-view.js        # Canvas／SVG 圖形分析
│  │  ├─ ai-parser/
│  │  │  ├─ parser.js            # 自然語言轉 LP 模型
│  │  │  └─ parser-view.js
│  │  └─ templates/
│  │     ├─ template-view.js
│  │     └─ template-controller.js
│  └─ ui/
│     ├─ dom.js                   # DOM 查找與安全更新的小工具
│     ├─ formatters.js            # 數字、下標與線性式格式化
│     └─ model-banner.js          # 顯示目前使用的模型
└─ tests/
   ├─ domain/
   │  ├─ lp-solver.test.js
   │  ├─ integer-solver.test.js
   │  └─ transport-model.test.js
   └─ features/
      └─ parser.test.js
```

## 3. 模組責任

### `domain`

只處理數學模型與計算，不直接讀取 DOM，也不呼叫 `document.getElementById`。輸入與輸出使用純 JavaScript 物件，方便單元測試。

建議的 LP 模型介面：

```js
{
  type: 'max' | 'min',
  unit: string,
  numVars: number,
  varNames: string[],
  varTypes: ('cont' | 'free' | 'int' | 'bin')[],
  objCoeffs: number[],
  constraints: [{
    name: string,
    coeffs: number[],
    op: '<=' | '>=' | '=',
    rhs: number
  }]
}
```

求解器只回傳結果，不負責畫面顯示：

```js
{
  status: 'optimal' | 'infeasible' | 'unbounded',
  x: number[],
  z: number,
  constraints: ConstraintResult[]
}
```

### `features`

負責一個使用者功能的流程：讀取輸入、呼叫 `domain`、更新狀態，再交給 view 顯示。不同功能之間透過模型物件和事件溝通，不直接修改彼此的 DOM。

### `app`

集中處理全域狀態與視圖切換，例如目前選擇的題型、目前使用的模型、目前 sidebar 頁面。`model-banner.js` 只接收模型名稱，不自行判斷題型。

### `styles`

把目前 `<style>` 內容依用途拆開。Tailwind 若仍要使用 CDN，可以先留在 `index.html`；完成模組化後再評估改成 npm 依賴。

## 4. 狀態設計

目前的 `lpState`、`tpState`、`guidedScenario` 應集中成單一狀態物件：

```js
const appState = {
  activeView: 'onboarding',
  guidedScenario: null,
  currentModel: null,
  lp: createDefaultLpState(),
  transport: createDefaultTransportState(),
  lastSolution: null
};
```

更新狀態時使用明確函式，例如 `setCurrentModel(model)`、`setGuidedScenario(key)`，避免每個功能直接任意修改全域變數。

## 5. 從 `index.html` 搬移的對應表

| 目前內容 | 目標檔案 |
|---|---|
| `<style>` 全部 CSS | `src/styles/` 三個 CSS 檔 |
| `guidedScenarioData` | `src/data/guided-scenarios.js` |
| `loadPreset` 使用的資料 | `src/data/presets.js` |
| `loadTemplateModel` 內的模型資料 | `src/data/templates.js` |
| `solveContinuousLP`、`runSimplexPhase` | `src/domain/lp-solver.js` |
| `solveFullLPModel` | `src/domain/integer-solver.js` |
| `clipPolygonByHalfPlane`、`draw2DGraph` | `src/domain/geometry.js`、`src/features/analysis/graph-view.js` |
| `renderGuidedForm`、`startGuidedScenario` | `src/features/onboarding/` |
| `renderAllGeneralLPInputs`、`renderLiveMathModel` | `src/features/general-lp/` |
| `renderTransportInputTable`、`buildAndSolveTransport` | `src/features/transport/` |
| `parseNaturalLanguageToLP` | `src/features/ai-parser/` |
| `showToast`、`switchMainTab`、sidebar 函式 | `src/app/` |
| `fmtNum`、`subDigit`、`formatLinearExpression` | `src/ui/formatters.js` |

## 6. 建議拆分順序

1. **建立 `src/` 與入口**：先把 CSS、資料與純工具搬出，畫面行為維持不變。
2. **抽出 domain 求解器**：先搬 `solveContinuousLP`、`solveFullLPModel`，讓它們不依賴 DOM。
3. **抽出一般 LP 功能**：拆分變數、限制式、即時模型預覽與結果顯示。
4. **抽出運輸與分析功能**：運輸矩陣、結果表、圖形分析各自管理。
5. **抽出 onboarding 與範本**：完成選題、目前模型提示與範本載入的責任分離。
6. **最後縮減 `index.html`**：只保留頁面容器、必要的靜態骨架與 `<script type="module" src="/src/main.js">`。

每一步都應保持既有流程可操作，再進行下一步，避免一次重寫造成難以定位的回歸問題。

## 7. 建議的模組邊界規則

- `domain/` 不可依賴 DOM、CSS 或瀏覽器事件。
- `data/` 只輸出常數與建立初始資料的函式，不執行求解。
- `features/` 不直接實作 Simplex 或分支定界，統一呼叫 `domain/`。
- `view` 函式負責渲染，`controller` 函式負責事件與流程。
- 一個檔案先維持單一主要責任；超過約 300 行再拆更細的子模組。
- 所有使用者輸入在送入求解器前集中驗證，避免每個畫面各自處理不同規則。

## 8. 暫不處理的事項

- 暫不改寫求解演算法。
- 暫不更換 UI 框架。
- 暫不將外部 CDN 全部改成 npm 套件。
- 暫不改變現有模型資料格式與使用者操作流程。

這份設計先作為拆分工作的基準；實際搬移時應以小批次 commit 進行，讓每次變更都能獨立檢查與回復。
