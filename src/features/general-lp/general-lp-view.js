import { fmtNum, subDigit, formatLinearExpression } from '../../ui/formatters.js';
import { escapeHtml } from '../../ui/dom.js';
export function renderAllGeneralLPInputs() {
            setProblemType(lpState.type);
            document.getElementById('input-var-count').value = lpState.numVars;
            document.getElementById('obj-unit-input').value = lpState.unit;

            // 1. 渲染決策變數設定區
            const varContainer = document.getElementById('var-settings-container');
            varContainer.innerHTML = '';
            for (let i = 0; i < lpState.numVars; i++) {
                const sub = subDigit(i + 1);
                const div = document.createElement('div');
                div.className = 'flex items-center gap-2 bg-slate-950/90 p-2 rounded-xl border border-slate-800';
                div.innerHTML = `
                    <span class="px-2 py-1 rounded-lg bg-slate-900 text-cyan-400 font-mono font-bold text-xs border border-slate-800">x${sub}</span>
                    <input type="text" value="${lpState.varNames[i] || ''}" placeholder="變數名稱"
                        oninput="lpState.varNames[${i}] = this.value; renderLiveMathModel();"
                        class="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                    <select onchange="lpState.varTypes[${i}] = this.value; renderLiveMathModel();"
                        class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500">
                        <option value="cont" ${lpState.varTypes[i] === 'cont' ? 'selected' : ''}>x${sub} ≥ 0 (非負)</option>
                        <option value="free" ${lpState.varTypes[i] === 'free' ? 'selected' : ''}>x${sub} Free (取消非負)</option>
                        <option value="int" ${lpState.varTypes[i] === 'int' ? 'selected' : ''}>x${sub} ∈ ℤ⁺ (整數)</option>
                        <option value="bin" ${lpState.varTypes[i] === 'bin' ? 'selected' : ''}>x${sub} ∈ {0,1} (二元)</option>
                    </select>
                `;
                varContainer.appendChild(div);
            }

            // 2. 渲染目標函數係數輸入
            const objContainer = document.getElementById('obj-coeffs-container');
            objContainer.innerHTML = '';
            for (let i = 0; i < lpState.numVars; i++) {
                const sub = subDigit(i + 1);
                const item = document.createElement('div');
                item.className = 'flex items-center gap-1.5';
                item.innerHTML = `
                    ${i > 0 ? '<span class="text-slate-500 font-mono font-bold">+</span>' : ''}
                    <input type="number" step="any" value="${lpState.objCoeffs[i]}"
                        oninput="lpState.objCoeffs[${i}] = parseFloat(this.value) || 0; renderLiveMathModel();"
                        class="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-sm text-white focus:outline-none focus:border-cyan-500">
                    <span class="font-mono text-sm text-cyan-300 font-semibold">x${sub}</span>
                `;
                objContainer.appendChild(item);
            }

            // 3. 渲染限制式列表
            renderConstraintsList();

            // 4. 渲染即時數學式
            renderLiveMathModel();
        }

export function renderConstraintsList() {
            const container = document.getElementById('constraints-container');
            container.innerHTML = '';

            lpState.constraints.forEach((c, cIdx) => {
                const row = document.createElement('div');
                row.className = 'bg-slate-950/90 p-3.5 rounded-xl border border-slate-800/90 space-y-2.5 transition hover:border-slate-700';

                let coeffsHtml = '';
                for (let i = 0; i < lpState.numVars; i++) {
                    const sub = subDigit(i + 1);
                    coeffsHtml += `
                        <div class="flex items-center gap-1">
                            ${i > 0 ? '<span class="text-slate-500 font-mono text-xs">+</span>' : ''}
                            <input type="number" step="any" value="${c.coeffs[i] ?? 0}"
                                oninput="lpState.constraints[${cIdx}].coeffs[${i}] = parseFloat(this.value) || 0; renderLiveMathModel();"
                                class="w-16 sm:w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500">
                            <span class="font-mono text-xs sm:text-sm text-slate-300">x${sub}</span>
                        </div>
                    `;
                }

                row.innerHTML = `
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">C${cIdx + 1}</span>
                            <input type="text" value="${escapeHtml(c.name || '')}" placeholder="限制式名稱 (例如：預算限制)"
                                oninput="lpState.constraints[${cIdx}].name = this.value; renderLiveMathModel();"
                                class="w-44 sm:w-56 bg-transparent border-b border-slate-800 focus:border-cyan-500 text-xs text-slate-200 py-0.5 focus:outline-none">
                        </div>
                        <button type="button" onclick="removeConstraint(${cIdx})" class="text-slate-500 hover:text-rose-400 text-xs px-2 py-1 rounded transition" title="刪除此限制式">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 pt-1">
                        <div class="flex flex-wrap items-center gap-1.5 flex-1">
                            ${coeffsHtml}
                        </div>
                        <div class="flex items-center gap-2">
                            <select onchange="lpState.constraints[${cIdx}].op = this.value; renderLiveMathModel();"
                                class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-sm font-bold text-amber-400 focus:outline-none focus:border-cyan-500">
                                <option value="<=" ${c.op === '<=' ? 'selected' : ''}>≤</option>
                                <option value="=" ${c.op === '=' ? 'selected' : ''}>=</option>
                                <option value=">=" ${c.op === '>=' ? 'selected' : ''}>≥</option>
                            </select>
                            <input type="number" step="any" value="${c.rhs}"
                                oninput="lpState.constraints[${cIdx}].rhs = parseFloat(this.value) || 0; renderLiveMathModel();"
                                class="w-20 sm:w-24 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-sm font-semibold text-emerald-300 focus:outline-none focus:border-cyan-500">
                        </div>
                    </div>
                `;
                container.appendChild(row);
            });
        }

export function renderLiveMathModel() {
            const box = document.getElementById('live-math-display');
            const n = lpState.numVars;
            const objExpr = formatLinearExpression(lpState.objCoeffs, n);
            const typeStr = lpState.type === 'max' ? 'max' : 'min';

            let stHtml = '';
            lpState.constraints.forEach((c, idx) => {
                const expr = formatLinearExpression(c.coeffs, n);
                const opSym = c.op === '<=' ? '≤' : (c.op === '>=' ? '≥' : '=');
                const label = c.name ? `<span class="text-slate-500 text-xs ml-3">// ${escapeHtml(c.name)}</span>` : '';
                stHtml += `<div class="pl-4 text-slate-200">${expr} <span class="text-amber-400 font-bold">${opSym}</span> <span class="text-emerald-300">${fmtNum(c.rhs)}</span>${label}</div>`;
            });

            // 整理定義域條件
            let nonNegVars = [];
            let freeVars = [];
            let intVars = [];
            let binVars = [];
            for (let i = 0; i < n; i++) {
                const v = `x${subDigit(i + 1)}`;
                const t = lpState.varTypes[i] || 'cont';
                if (t === 'cont') nonNegVars.push(v);
                else if (t === 'free') freeVars.push(v);
                else if (t === 'int') { nonNegVars.push(v); intVars.push(v); }
                else if (t === 'bin') binVars.push(v);
            }

            let domainLines = [];
            if (nonNegVars.length > 0) domainLines.push(`${nonNegVars.join(', ')} ≥ 0`);
            if (freeVars.length > 0) domainLines.push(`${freeVars.join(', ')} Free (無非負限制)`);
            if (intVars.length > 0) domainLines.push(`${intVars.join(', ')} ∈ ℤ⁺ (整數)`);
            if (binVars.length > 0) domainLines.push(`${binVars.join(', ')} ∈ {0, 1} (二元)`);

            box.innerHTML = `
                <div class="text-cyan-300 font-bold text-base">
                    <span class="uppercase text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 mr-1">${typeStr}</span> Z = ${objExpr}
                </div>
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">subject to (受限於)</div>
                <div class="space-y-1.5 border-l-2 border-slate-800 ml-1">
                    ${stHtml}
                </div>
                <div class="pt-2 border-t border-slate-800/80 text-xs text-indigo-300 space-y-1">
                    ${domainLines.map(line => `<div>${line}</div>`).join('')}
                </div>
            `;
        }

if (typeof window !== 'undefined') {
    Object.assign(window, { renderAllGeneralLPInputs, renderConstraintsList, renderLiveMathModel });
}
