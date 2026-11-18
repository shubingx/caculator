import { fmtNum, subDigit, formatLinearExpression } from '../../ui/formatters.js';
import { escapeHtml } from '../../ui/dom.js';
export function solveCurrentLP() {
            const sol = solveFullLPModel(lpState);
            lastSolution = sol;

            const statusBadge = document.getElementById('solution-status-badge');
            const errorBox = document.getElementById('solution-error-box');
            const contentWrapper = document.getElementById('solution-content-wrapper');

            if (sol.truncated || sol.status === 'limit') {
                statusBadge.innerHTML = `
                    <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-2">
                        <i class="fa-solid fa-hourglass-half"></i> 整數搜尋達到節點上限
                    </span>
                `;
                errorBox.className = 'rounded-2xl p-6 bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2';
                errorBox.textContent = '分支界限搜尋已達 250 個節點上限，尚未證明目前最佳整數解為全域最佳解。請簡化模型後重試。';
                contentWrapper.classList.add('hidden');
                showToast('整數搜尋已達節點上限；結果尚未證明為最佳解。', 'warn');
                return;
            }

            if (sol.status === 'infeasible') {
                statusBadge.innerHTML = `
                    <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-2">
                        <i class="fa-solid fa-circle-exclamation"></i> 無可行解 (Infeasible Solution)
                    </span>
                `;
                errorBox.className = 'rounded-2xl p-6 bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-2';
                errorBox.innerHTML = `
                    <div class="text-base font-bold flex items-center gap-2 text-rose-300">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>系統偵測結果：此線性規劃問題「無可行解 (Infeasible)」</span>
                    </div>
                    <p class="text-sm text-rose-200/90 leading-relaxed">
                        <strong>原因分析：</strong>您設定的限制條件彼此衝突（例如同時要求資源使用量小於 10 又必須大於 20），導致沒有任何一組決策變數 <span class="font-mono">(x₁, x₂, ...)</span> 能同時滿足所有限制式（可行解區域為空集合 ∅）。
                    </p>
                    <p class="text-xs text-rose-300/80 pt-1">
                        建議調整：請放寬 <span class="font-mono">≥</span> 最低需求限制，或增加 <span class="font-mono">≤</span> 資源上限常數 (RHS)。
                    </p>
                `;
                contentWrapper.classList.add('hidden');
                if (lpState.numVars === 2) {
                    contentWrapper.classList.remove('hidden');
                    document.getElementById('graphical-analysis-card').classList.remove('hidden');
                    draw2DGraph();
                }
                showToast('問題無可行解 (Infeasible)，請檢查限制條件衝突。', 'error');
                return;
            }

            if (sol.status === 'unbounded') {
                statusBadge.innerHTML = `
                    <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-2">
                        <i class="fa-solid fa-infinity"></i> 無界解 (Unbounded Solution)
                    </span>
                `;
                errorBox.className = 'rounded-2xl p-6 bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2';
                errorBox.innerHTML = `
                    <div class="text-base font-bold flex items-center gap-2 text-amber-300">
                        <i class="fa-solid fa-infinity"></i>
                        <span>系統偵測結果：此線性規劃問題為「無界解 (Unbounded)」</span>
                    </div>
                    <p class="text-sm text-amber-200/90 leading-relaxed">
                        <strong>原因分析：</strong>可行解區域向無限遠處延伸，且目標函數值 <span class="font-mono">Z</span> 可以無限制地${lpState.type === 'max' ? '增大至 +∞' : '減小至 -∞'}，而不會違反任何一條限制式。
                    </p>
                    <p class="text-xs text-amber-300/80 pt-1">
                        建議調整：在實際管理問題中，通常代表遺漏了關鍵的資源上限限制式 (<span class="font-mono">≤</span>)。
                    </p>
                `;
                contentWrapper.classList.add('hidden');
                if (lpState.numVars === 2) {
                    contentWrapper.classList.remove('hidden');
                    document.getElementById('graphical-analysis-card').classList.remove('hidden');
                    draw2DGraph();
                }
                showToast('問題為無界解 (Unbounded)，目標函數可無限延伸。', 'warn');
                return;
            }

            // 最佳解呈現
            errorBox.className = 'hidden';
            contentWrapper.classList.remove('hidden');

            statusBadge.innerHTML = `
                <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2">
                    <i class="fa-solid fa-circle-check"></i> 已求得最佳解 (Optimal Solution Found)
                </span>
            `;

            // 1. 最佳目標函數值 Z*
            document.getElementById('res-obj-type-label').textContent = lpState.type === 'max'
                ? '最大目標函數值 (Max Z*)'
                : '最小目標函數值 (Min Z*)';
            document.getElementById('res-z-value').textContent = fmtNum(sol.z);
            document.getElementById('res-z-unit').textContent = `目標單位：${lpState.unit || '單位'}`;
            document.getElementById('res-iter-info').textContent = sol.isIntegerOptimal
                ? `分支界限與單形迭代：${sol.iterations} 次 (整數最佳解)`
                : `兩階段單形法迭代：${sol.iterations} 次`;

            // 2. 各決策變數最佳值卡片
            const varsGrid = document.getElementById('res-vars-grid');
            varsGrid.innerHTML = '';
            for (let i = 0; i < lpState.numVars; i++) {
                const sub = subDigit(i + 1);
                const val = sol.x[i];
                const contrib = (lpState.objCoeffs[i] || 0) * val;
                const vName = lpState.varNames[i] || `變數 x${sub}`;
                const card = document.createElement('div');
                card.className = 'p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between';
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-medium text-slate-400 truncate" title="${vName}">${vName}</span>
                        <span class="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">x${sub}*</span>
                    </div>
                    <div class="my-2 text-2xl font-extrabold font-mono text-white">${fmtNum(val)}</div>
                    <div class="text-[11px] text-slate-500 font-mono">
                        目標貢獻: ${contrib >= 0 ? '+' : ''}${fmtNum(contrib)}
                    </div>
                `;
                varsGrid.appendChild(card);
            }

            // 3. 功能需求 8：求解結果管理意涵解讀
            const summaryBox = document.getElementById('res-management-summary');
            const actionLines = [];
            for (let i = 0; i < lpState.numVars; i++) {
                const sub = subDigit(i + 1);
                const vName = lpState.varNames[i] || `決策變數 x${sub}`;
                const val = sol.x[i];
                actionLines.push(`<li><strong>${vName} (<span class="font-mono text-cyan-300">x${sub}*</span>)</strong>：建議投入 / 生產 <span class="font-mono font-bold text-white px-1.5 py-0.5 rounded bg-slate-800">${fmtNum(val)}</span> 單位（目標貢獻值：<span class="font-mono text-cyan-300">${fmtNum((lpState.objCoeffs[i] || 0) * val)}</span>）</li>`);
            }
            const goalText = lpState.type === 'max' ? '最大總目標值（如最大利潤/效益）' : '最小總目標值（如最低成本/耗損）';
            summaryBox.innerHTML = `
                <div class="font-semibold text-indigo-300 mb-1">【最佳管理決策方案】</div>
                <ul class="list-disc list-inside space-y-1 text-slate-200">
                    ${actionLines.join('')}
                </ul>
                <div class="pt-2 mt-2 border-t border-slate-800/80 text-emerald-300 font-medium">
                    <i class="fa-solid fa-check-double mr-1.5"></i>依此方案執行，可在滿足所有資源與規範限制下，達成${goalText} <strong class="font-mono text-base text-white">Z* = ${fmtNum(sol.z)}</strong>（${lpState.unit}）。
                </div>
            `;

            // 4. 功能需求 9 & 10：限制式分析與敏感度分析表格
            const tbody = document.getElementById('res-constraints-tbody');
            tbody.innerHTML = '';
            const notesList = document.getElementById('res-sensitivity-notes');
            notesList.innerHTML = '';

            sol.constraints.forEach((c, idx) => {
                const mathStr = `${formatLinearExpression(c.coeffs, lpState.numVars)} ${c.op === '<=' ? '≤' : (c.op === '>=' ? '≥' : '=')} ${fmtNum(c.rhs)}`;
                const opSym = c.op === '<=' ? '≤' : (c.op === '>=' ? '≥' : '=');
                const slackLabel = c.op === '<=' ? 'Slack (鬆弛)' : (c.op === '>=' ? 'Surplus (剩餘)' : '差額');

                const statusBadgeHtml = c.isBinding
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                         <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Binding (緊束/等號成立)
                       </span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-medium bg-slate-800 text-slate-400 border border-slate-700">
                         Nonbinding (${slackLabel} ${fmtNum(c.slack)})
                       </span>`;

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-900/50 transition';
                tr.innerHTML = `
                    <td class="py-3 px-4">
                        <div class="font-sans font-semibold text-slate-200">${escapeHtml(c.name)}</div>
                        <div class="text-xs text-slate-500">${mathStr}</div>
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-white">${fmtNum(c.lhs)}</td>
                    <td class="py-3 px-4 text-center text-amber-400 font-bold">${opSym}</td>
                    <td class="py-3 px-4 text-right text-slate-300">${fmtNum(c.rhs)}</td>
                    <td class="py-3 px-4 text-right ${c.slack > 1e-5 ? 'text-amber-300' : 'text-slate-500'}">
                        ${fmtNum(c.slack)} <span class="text-[10px] font-sans text-slate-500">(${slackLabel})</span>
                    </td>
                    <td class="py-3 px-4 text-right font-bold ${Math.abs(c.shadowPrice) > 1e-5 ? 'text-cyan-400' : 'text-slate-500'}">
                        ${sol.isIntegerOptimal ? '<span class="text-xs font-sans text-slate-500">N/A (整數規劃)</span>' : fmtNum(c.shadowPrice)}
                    </td>
                    <td class="py-3 px-4 text-center">${statusBadgeHtml}</td>
                `;
                tbody.appendChild(tr);

                // 自動生成每條限制式的敏感度管理意涵
                const li = document.createElement('li');
                if (c.isBinding) {
                    if (!sol.isIntegerOptimal && Math.abs(c.shadowPrice) > 1e-6) {
                        const dirText = c.shadowPrice > 0 ? `增加 ${fmtNum(c.shadowPrice)}` : `改變 ${fmtNum(c.shadowPrice)}`;
                        li.innerHTML = `<strong class="text-emerald-300">【${escapeHtml(c.name)}】</strong>為<strong>瓶頸資源 (Binding Constraint)</strong>，資源已全數用罄（Slack = 0）。其影子價格 (Shadow Price) 為 <span class="font-mono text-cyan-300 font-bold">${fmtNum(c.shadowPrice)}</span>，代表在現行最佳基底不變範圍內，每增加 1 單位【${escapeHtml(c.name)}】右端上限，最佳目標函數值 Z* 可${dirText} 單位。`;
                    } else {
                        li.innerHTML = `<strong class="text-emerald-300">【${escapeHtml(c.name)}】</strong>為<strong>緊束限制 (Binding Constraint)</strong>，在最佳解下等號完全成立（LHS = RHS = ${fmtNum(c.rhs)}）。`;
                    }
                } else {
                    const remainType = c.op === '<=' ? `尚有未用完之餘裕（鬆弛量 Slack = ${fmtNum(c.slack)} 單位）` : `超出最低要求標準（剩餘量 Surplus = ${fmtNum(c.slack)} 單位）`;
                    li.innerHTML = `<strong class="text-slate-300">【${escapeHtml(c.name)}】</strong>為<strong>非緊束限制 (Nonbinding Constraint)</strong>，${remainType}。其影子價格為 <span class="font-mono">0</span>，單獨增加此資源上限並不會改善目標函數值。`;
                }
                notesList.appendChild(li);
            });

            // 5. 功能需求 11(a)：當決策變數個數為 2 時，自動顯示並繪製 2D 圖形化分析
            const graphCard = document.getElementById('graphical-analysis-card');
            if (lpState.numVars === 2) {
                graphCard.classList.remove('hidden');
                setTimeout(() => draw2DGraph(), 30);
            } else {
                graphCard.classList.add('hidden');
            }
        }

        /*************************************************************************
         * 功能需求 11(a)：雙變數 2D 圖形化分析引擎 (HTML5 Canvas)
         * - 使用 Sutherland-Hodgman 多邊形裁剪演算法精確繪製可行域 (Feasible Region)
         * - 自動計算所有交點與可行端點 (Corner Points)
         * - 繪製各限制式直線、等利潤/等成本線 (Iso-profit / Iso-cost Line) 與最佳解位置
         *************************************************************************/

if (typeof window !== 'undefined') {
    Object.assign(window, { solveCurrentLP });
}
