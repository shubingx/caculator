import { createTransportModel } from '../../domain/transport-model.js';
import { transportPresets } from '../../data/transport-presets.js';
import { fmtNum, subDigit } from '../../ui/formatters.js';
import { escapeHtml } from '../../ui/dom.js';
export function loadTransportPreset(key) {
    const preset = transportPresets[key];
    if (!preset) {
        showToast(`找不到運輸範例：${key}`, 'error');
        return;
    }

    tpState = JSON.parse(JSON.stringify(preset.state));
    showToast(preset.message, 'info');
    document.getElementById('tp-sources-select').value = tpState.numSources;
    document.getElementById('tp-dests-select').value = tpState.numDests;
    renderTransportInputTable();
    buildAndSolveTransport(true);
}

export function resizeTransportMatrix() {
            const m = parseInt(document.getElementById('tp-sources-select').value, 10);
            const n = parseInt(document.getElementById('tp-dests-select').value, 10);
            tpState.numSources = m;
            tpState.numDests = n;

            tpState.sourceNames.length = m;
            tpState.supplies.length = m;
            tpState.destNames.length = n;
            tpState.demands.length = n;
            tpState.costs.length = m;
            while (tpState.sourceNames.length < m) tpState.sourceNames.push(`S${tpState.sourceNames.length + 1}`);
            while (tpState.destNames.length < n) tpState.destNames.push(String.fromCharCode(65 + tpState.destNames.length));
            while (tpState.supplies.length < m) tpState.supplies.push(200);
            while (tpState.demands.length < n) tpState.demands.push(150);
            while (tpState.costs.length < m) tpState.costs.push(new Array(n).fill(15));
            tpState.costs.forEach(row => {
                row.length = n;
                while (row.length < n) row.push(15);
            });

            renderTransportInputTable();
            buildAndSolveTransport(false);
        }

export function updateTPBalanceBanner() {
            const m = tpState.numSources;
            const n = tpState.numDests;
            const totalSupply = tpState.supplies.slice(0, m).reduce((a, b) => a + (Number(b) || 0), 0);
            const totalDemand = tpState.demands.slice(0, n).reduce((a, b) => a + (Number(b) || 0), 0);

            const banner = document.getElementById('tp-balance-banner');
            let statusHtml = '';
            if (Math.abs(totalSupply - totalDemand) < 1e-6) {
                statusHtml = `<span class="text-emerald-400 font-semibold"><i class="fa-solid fa-scale-balanced mr-1"></i>供需平衡運輸問題 (總供給 = 總需求 = ${totalSupply})</span>`;
            } else if (totalSupply > totalDemand) {
                statusHtml = `<span class="text-cyan-400 font-semibold"><i class="fa-solid fa-boxes-stacked mr-1"></i>供過於求 (總供給 ${totalSupply} > 總需求 ${totalDemand}，將產生 ${totalSupply - totalDemand} 單位剩餘供應量)</span>`;
            } else {
                statusHtml = `<span class="text-rose-400 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>供不應求警告 (總供給 ${totalSupply} < 總需求 ${totalDemand}，無法滿足所有市場需求！)</span>`;
            }

            banner.innerHTML = `
                <div class="flex items-center gap-4 font-mono">
                    <span>總供應量 (Total Supply): <strong class="text-white">${totalSupply}</strong></span>
                    <span>|</span>
                    <span>總需求量 (Total Demand): <strong class="text-white">${totalDemand}</strong></span>
                </div>
                <div>${statusHtml}</div>
            `;
        }

export function renderTransportInputTable() {
            const m = tpState.numSources;
            const n = tpState.numDests;
            const table = document.getElementById('tp-input-table');

            let thead = `<tr class="bg-slate-900 text-slate-300 border-b border-slate-800">
                <th class="py-2.5 px-3 text-left font-semibold">供給地 \\ 需求地 (單位成本 cᵢⱼ)</th>`;
            for (let j = 0; j < n; j++) {
                thead += `<th class="py-2.5 px-2 text-center font-mono text-cyan-300">
                    需求地 ${escapeHtml(tpState.destNames[j])}
                </th>`;
            }
            thead += `<th class="py-2.5 px-3 text-right font-semibold text-emerald-300">供應量 (Supply)</th></tr>`;

            let tbody = '';
            for (let i = 0; i < m; i++) {
                tbody += `<tr class="border-b border-slate-800/70">
                    <td class="py-2 px-3 font-mono font-bold text-indigo-300 bg-slate-900/50">
                        供給地 ${escapeHtml(tpState.sourceNames[i])}
                    </td>`;
                for (let j = 0; j < n; j++) {
                    tbody += `<td class="p-1.5 text-center">
                        <input type="number" step="any" value="${tpState.costs[i][j]}"
                            oninput="tpState.costs[${i}][${j}] = parseFloat(this.value) || 0; buildAndSolveTransport(false);"
                            class="w-16 sm:w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500">
                    </td>`;
                }
                tbody += `<td class="p-1.5 text-right bg-emerald-950/20">
                    <input type="number" step="any" value="${tpState.supplies[i]}"
                        oninput="tpState.supplies[${i}] = parseFloat(this.value) || 0; updateTPBalanceBanner(); buildAndSolveTransport(false);"
                        class="w-20 sm:w-24 px-2 py-1 bg-slate-900 border border-emerald-500/40 rounded-lg text-right font-mono font-bold text-xs sm:text-sm text-emerald-300 focus:outline-none focus:border-emerald-400">
                </td></tr>`;
            }

            // 需求量列 (Demand Row)
            tbody += `<tr class="bg-amber-950/20">
                <td class="py-2.5 px-3 font-semibold text-amber-300">需求量 (Demand)</td>`;
            for (let j = 0; j < n; j++) {
                tbody += `<td class="p-1.5 text-center">
                    <input type="number" step="any" value="${tpState.demands[j]}"
                        oninput="tpState.demands[${j}] = parseFloat(this.value) || 0; updateTPBalanceBanner(); buildAndSolveTransport(false);"
                        class="w-16 sm:w-20 px-2 py-1 bg-slate-900 border border-amber-500/40 rounded-lg text-right font-mono font-bold text-xs sm:text-sm text-amber-300 focus:outline-none focus:border-amber-400">
                </td>`;
            }
            const totalS = tpState.supplies.slice(0, m).reduce((a, b) => a + (Number(b) || 0), 0);
            const totalD = tpState.demands.slice(0, n).reduce((a, b) => a + (Number(b) || 0), 0);
            tbody += `<td class="py-2 px-3 text-right font-mono text-xs text-slate-300">
                S:${totalS} / D:${totalD}
            </td></tr>`;

            table.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
            updateTPBalanceBanner();
        }

export function generateTransportLPModelObject() {
    return createTransportModel(tpState);
}

export function buildAndSolveTransport(doSolve = true) {
            const m = tpState.numSources;
            const n = tpState.numDests;
            const tpLP = generateTransportLPModelObject();

            document.getElementById('tp-var-count-tag').textContent = `${m * n} 決策變數 / ${m + n} 限制式`;

            // Step 5: 渲染完整運輸問題數學模式
            let objTerms = [];
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    const c = tpState.costs[i][j] || 0;
                    objTerms.push(`${c}x${subDigit(i + 1)}${subDigit(j + 1)}`);
                }
            }

            let supplyLines = [];
            for (let i = 0; i < m; i++) {
                let rowTerms = [];
                for (let j = 0; j < n; j++) {
                    rowTerms.push(`x${subDigit(i + 1)}${subDigit(j + 1)}`);
                }
                supplyLines.push(`<div class="pl-3">${rowTerms.join(' + ')} <span class="text-amber-400">≤</span> <span class="text-emerald-300">${tpState.supplies[i]}</span> <span class="text-slate-500 text-xs">// ${escapeHtml(tpState.sourceNames[i])} 供給上限</span></div>`);
            }

            let demandLines = [];
            for (let j = 0; j < n; j++) {
                let colTerms = [];
                for (let i = 0; i < m; i++) {
                    colTerms.push(`x${subDigit(i + 1)}${subDigit(j + 1)}`);
                }
                demandLines.push(`<div class="pl-3">${colTerms.join(' + ')} <span class="text-amber-400">=</span> <span class="text-amber-300">${tpState.demands[j]}</span> <span class="text-slate-500 text-xs">// 市場 ${escapeHtml(tpState.destNames[j])} 需求滿足</span></div>`);
            }

            const mathBox = document.getElementById('tp-math-model-box');
            mathBox.innerHTML = `
                <div class="text-cyan-300 font-bold">min Z = ${objTerms.join(' + ')}</div>
                <div class="text-xs text-slate-400 uppercase font-semibold pt-1">subject to (Supply Constraints)</div>
                <div class="space-y-1 border-l-2 border-emerald-500/40">${supplyLines.join('')}</div>
                <div class="text-xs text-slate-400 uppercase font-semibold pt-1">subject to (Demand Constraints)</div>
                <div class="space-y-1 border-l-2 border-amber-500/40">${demandLines.join('')}</div>
                <div class="pt-2 border-t border-slate-800 text-indigo-300 text-xs">
                    xᵢⱼ ≥ 0 (∀ i = 1..${m}, j = 1..${n})
                </div>
            `;

            if (!doSolve) return;

            // Step 6: 呼叫單形法引擎求解
            const sol = solveFullLPModel(tpLP);
            const resSection = document.getElementById('tp-results-section');
            resSection.classList.remove('hidden');

            if (sol.status !== 'optimal') {
                document.getElementById('tp-res-total-cost').textContent = sol.status === 'infeasible' ? '無可行解' : `求解失敗 (${sol.status})`;
                document.getElementById('tp-res-routes-tbody').innerHTML = `
                    <tr><td colspan="5" class="py-4 text-center text-rose-400">${sol.status === 'infeasible' ? '目前無法滿足所有需求，請檢查供應量與需求量。' : '求解器未回傳最佳解，請檢查輸入資料或稍後重試。'}</td></tr>
                `;
                return;
            }

            document.getElementById('tp-res-total-cost').textContent = `$${fmtNum(sol.z)}`;

            // Step 7(a): 最佳運輸路線表
            const routesTbody = document.getElementById('tp-res-routes-tbody');
            routesTbody.innerHTML = '';
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    const qty = sol.x[i * n + j];
                    if (qty > 1e-5) {
                        const unitCost = tpState.costs[i][j];
                        const subCost = qty * unitCost;
                        routesTbody.innerHTML += `
                            <tr class="hover:bg-slate-900/60">
                                <td class="py-2 px-3 font-bold text-indigo-300">${escapeHtml(tpState.sourceNames[i])}</td>
                                <td class="py-2 px-3 font-bold text-cyan-300">市場 ${escapeHtml(tpState.destNames[j])}</td>
                                <td class="py-2 px-3 text-right text-slate-400">$${fmtNum(unitCost)}</td>
                                <td class="py-2 px-3 text-right font-extrabold text-white">${fmtNum(qty)}</td>
                                <td class="py-2 px-3 text-right text-emerald-300">$${fmtNum(subCost)}</td>
                            </tr>
                        `;
                    }
                }
            }

            // Step 7(b): 最佳調度矩陣視圖
            let matrixHtml = `<table class="w-full text-xs sm:text-sm font-mono border-collapse">
                <thead><tr class="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th class="py-2 px-3 text-left">來源 \\ 目的</th>`;
            for (let j = 0; j < n; j++) {
                matrixHtml += `<th class="py-2 px-3 text-center text-cyan-300">${escapeHtml(tpState.destNames[j])}</th>`;
            }
            matrixHtml += `<th class="py-2 px-3 text-right text-emerald-300">實際運出 / 供應上限</th></tr></thead><tbody>`;

            for (let i = 0; i < m; i++) {
                let rowSum = 0;
                matrixHtml += `<tr class="border-b border-slate-800/60">
                    <td class="py-2.5 px-3 font-bold text-indigo-300">${escapeHtml(tpState.sourceNames[i])}</td>`;
                for (let j = 0; j < n; j++) {
                    const qty = sol.x[i * n + j];
                    rowSum += qty;
                    const active = qty > 1e-5;
                    matrixHtml += `<td class="py-2.5 px-3 text-center ${active ? 'bg-cyan-500/15 text-white font-bold border border-cyan-500/30' : 'text-slate-600'}">
                        ${fmtNum(qty)}
                        <span class="block text-[10px] text-slate-500">(c=${tpState.costs[i][j]})</span>
                    </td>`;
                }
                matrixHtml += `<td class="py-2.5 px-3 text-right font-semibold text-slate-200">${fmtNum(rowSum)} / ${tpState.supplies[i]}</td></tr>`;
            }
            matrixHtml += `</tbody></table>`;
            document.getElementById('tp-res-matrix-container').innerHTML = matrixHtml;

            // Step 8: 供給地剩餘供應量與需求地 Binding / Shadow Price 分析
            const supplyList = document.getElementById('tp-supply-analysis-list');
            supplyList.innerHTML = '';
            for (let i = 0; i < m; i++) {
                const cInfo = sol.constraints[i];
                const remain = cInfo.slack;
                if (cInfo.isBinding) {
                    supplyList.innerHTML += `
                        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
                            <span><strong class="text-emerald-300">${escapeHtml(tpState.sourceNames[i])}</strong>：全數運出 (${fmtNum(cInfo.lhs)} / ${fmtNum(cInfo.rhs)})，剩餘 <strong>0</strong> 單位</span>
                            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-300">Binding (Shadow Price: ${fmtNum(cInfo.shadowPrice)})</span>
                        </div>
                    `;
                } else {
                    supplyList.innerHTML += `
                        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                            <span><strong class="text-cyan-300">${escapeHtml(tpState.sourceNames[i])}</strong>：尚餘 <strong class="font-mono text-amber-300">${fmtNum(remain)}</strong> 單位供應量 (運出 ${fmtNum(cInfo.lhs)} / ${fmtNum(cInfo.rhs)})</span>
                            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400">Nonbinding (Slack=${fmtNum(remain)})</span>
                        </div>
                    `;
                }
            }

            const demandList = document.getElementById('tp-demand-analysis-list');
            demandList.innerHTML = '';
            for (let j = 0; j < n; j++) {
                const cInfo = sol.constraints[m + j];
                demandList.innerHTML += `
                    <div class="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
                        <span><strong class="text-amber-300">${escapeHtml(tpState.destNames[j])}</strong>：需求限制 (${fmtNum(cInfo.rhs)} 單位) 100% 滿足</span>
                        <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/15 text-cyan-300">Binding | 影子價格 = ${fmtNum(cInfo.shadowPrice)}</span>
                    </div>
                `;
            }
        }

export function syncTransportToGeneralLP() {
            lpState = generateTransportLPModelObject();
            switchMainTab('general');
            renderAllGeneralLPInputs();
            solveCurrentLP();
            showToast('已將運輸問題 LP 模型同步載入至一般線性規劃計算器！', 'success');
        }

        /*************************************************************************
         * 進階功能 2：AI 自然語言協助建模 & 經典管理科學範本庫
         *************************************************************************/

if (typeof window !== 'undefined') {
    Object.assign(window, { loadTransportPreset, resizeTransportMatrix, updateTPBalanceBanner, renderTransportInputTable, generateTransportLPModelObject, buildAndSolveTransport, syncTransportToGeneralLP });
}
