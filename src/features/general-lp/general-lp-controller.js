export function setProblemType(type) {
            lpState.type = type;
            const btnMax = document.getElementById('btn-type-max');
            const btnMin = document.getElementById('btn-type-min');
            const badge = document.getElementById('obj-prefix-badge');

            if (type === 'max') {
                btnMax.className = 'py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 bg-cyan-600 text-white shadow';
                btnMin.className = 'py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
                badge.textContent = 'max Z =';
                badge.className = 'px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-sm border border-cyan-500/30';
            } else {
                btnMin.className = 'py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow';
                btnMax.className = 'py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
                badge.textContent = 'min Z =';
                badge.className = 'px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold text-sm border border-indigo-500/30';
            }
            renderLiveMathModel();
        }

export function changeVarCount(delta) {
            const next = Math.max(1, Math.min(16, lpState.numVars + delta));
            setVarCount(next);
        }

export function setVarCount(val) {
            let n = parseInt(val, 10);
            if (isNaN(n) || n < 1) n = 1;
            if (n > 16) n = 16;

            lpState.numVars = n;
            document.getElementById('input-var-count').value = n;

            // 擴充或裁切陣列
            while (lpState.varNames.length < n) {
                const idx = lpState.varNames.length + 1;
                lpState.varNames.push(`產品${String.fromCharCode(64 + idx)}`);
            }
            while (lpState.varTypes.length < n) {
                lpState.varTypes.push('cont');
            }
            while (lpState.objCoeffs.length < n) {
                lpState.objCoeffs.push(0);
            }

            lpState.constraints.forEach(c => {
                while (c.coeffs.length < n) c.coeffs.push(0);
            });

            renderAllGeneralLPInputs();
        }

export function addConstraint() {
            const idx = lpState.constraints.length + 1;
            lpState.constraints.push({
                name: `限制條件 ${idx}`,
                coeffs: new Array(lpState.numVars).fill(1),
                op: '<=',
                rhs: 10
            });
            renderConstraintsList();
            renderLiveMathModel();
        }

export function removeConstraint(idx) {
            if (lpState.constraints.length <= 1) {
                showToast('系統至少需保留一條限制式', 'warn');
                return;
            }
            lpState.constraints.splice(idx, 1);
            renderConstraintsList();
            renderLiveMathModel();
        }

export function updateModelState() {
            lpState.unit = document.getElementById('obj-unit-input').value;
            renderLiveMathModel();
        }

        /*************************************************************************
         * 功能需求 6：即時顯示完整線性規劃數學模型
         *************************************************************************/

export function copyMathModel() {
            const box = document.getElementById('live-math-display');
            const text = box.innerText;
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            showToast('數學模型已複製到剪貼簿！', 'success');
        }

        /*************************************************************************
         * 核心數學引擎：兩階段單形法 (Two-Phase Simplex) + 分支界限法 (Branch & Bound)
         * 100% 純前端實作，精確計算：
         * - 最佳解 x* 與目標函數 Z*
         * - 無可行解 (Infeasible) 與無界解 (Unbounded) 判定
         * - 各限制式之左側值 (LHS)、鬆弛/剩餘量 (Slack/Surplus)、緊束狀態 (Binding)
         * - 各限制式之對偶影子價格 (Shadow Price)
         *************************************************************************/

export function loadPreset(presetKey) {
    const preset = presets[presetKey];
    if (!preset) {
        showToast(`找不到預設題目：${presetKey}`, 'error');
        return;
    }

    lpState = JSON.parse(JSON.stringify(preset.model));
    showToast(preset.message, preset.type);
    renderAllGeneralLPInputs();
    solveCurrentLP();
}

export function resetLPForm() {
            lpState = {
                type: 'max',
                unit: '元',
                numVars: 2,
                varNames: ['產品1', '產品2'],
                varTypes: ['cont', 'cont'],
                objCoeffs: [1, 1],
                constraints: [
                    { name: '限制式 1', coeffs: [1, 1], op: '<=', rhs: 10 }
                ]
            };
            renderAllGeneralLPInputs();
            solveCurrentLP();
            showToast('表單已重設為空白初始狀態', 'info');
        }

        /*************************************************************************
         * 進階功能 1：運輸問題範本 (Transportation Problem Step 1 ~ Step 8)
         *************************************************************************/

if (typeof window !== 'undefined') {
    Object.assign(window, { setProblemType, changeVarCount, setVarCount, addConstraint, removeConstraint, updateModelState, copyMathModel, loadPreset, resetLPForm });
}
import { presets } from '../../data/presets.js';
