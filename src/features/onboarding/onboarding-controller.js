import { guidedScenarioData } from '../../data/guided-scenarios.js';

let guidedTransportFormState = null;
export function renderGuidedForm(key) {
            const form = document.getElementById('guided-form');
            if (key === 'unsure') {
                form.innerHTML = '';
                return;
            }
            if (key === 'transport') {
                guidedTransportFormState = {
                    sources: [{ name: '倉庫 A', supply: 300 }, { name: '倉庫 B', supply: 300 }],
                    destinations: [{ name: '門市 A', demand: 250 }, { name: '門市 B', demand: 350 }],
                    costs: [[6, 9], [8, 4]]
                };
                renderGuidedTransportForm();
                return;
            }
            const defaultType = key === 'allocation' ? 'max' : 'min';
            form.innerHTML = `
                <div class="guided-form-card rounded-xl border border-slate-700 bg-slate-950/40 p-4 sm:p-5">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div><h4 class="text-base font-semibold text-white">輸入你的資料</h4><p class="mt-1 text-xs text-slate-400">只要填數字和名稱，不用寫公式。</p></div>
                        <label class="text-xs text-slate-300">你想要
                            <select id="guided-objective-type" class="ml-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"><option value="max" ${defaultType === 'max' ? 'selected' : ''}>收益最多</option><option value="min" ${defaultType === 'min' ? 'selected' : ''}>成本最少</option></select>
                        </label>
                    </div>
                    <div class="mt-5"><div class="flex items-center justify-between mb-2"><h5 class="text-sm font-medium text-cyan-200">商品或方案</h5><span class="text-[11px] text-slate-500">收益／成本、原料用量、工時用量</span></div><div id="guided-products" class="space-y-2"></div><button type="button" class="mt-2 text-xs text-cyan-300" onclick="addGuidedProduct()"><i class="fa-solid fa-plus mr-1"></i>新增商品</button></div>
                    <div class="mt-5"><h5 class="text-sm font-medium text-cyan-200 mb-2">限制條件</h5><p class="text-xs text-slate-500 mb-3">例如：工時最多 100 小時，或原料至少要使用 20 單位。</p><div id="guided-resources" class="space-y-2"></div></div>
                    <button type="button" class="mt-5 w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-3 text-sm font-semibold text-white" onclick="solveGuidedForm()"><i class="fa-solid fa-calculator mr-2"></i>計算我的問題</button>
                </div>`;
            document.getElementById('guided-products').innerHTML = [guidedProductRow('產品 A', defaultType === 'max' ? 20 : 5), guidedProductRow('產品 B', defaultType === 'max' ? 15 : 8)].join('');
            document.getElementById('guided-resources').innerHTML = [guidedResourceRow('原料', '<=', 20), guidedResourceRow('工時', '<=', 35)].join('');
        }

export function guidedProductRow(name, value) {
            const objective = document.getElementById('guided-objective-type')?.value === 'min' ? '每單位成本' : '每單位收益';
            return `<div class="guided-product-row relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pr-8">
                <label class="text-xs text-slate-400">產品／活動名稱<input data-field="name" value="${name}" placeholder="例如：產品 A" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"></label>
                <label class="text-xs text-slate-400">${objective}<input data-field="value" type="number" step="any" value="${value}" placeholder="請填金額" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"></label>
                <label class="text-xs text-slate-400">原料用量<input data-field="resource-1" type="number" step="any" value="2" placeholder="每單位用量" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"></label>
                <label class="text-xs text-slate-400">工時用量<input data-field="resource-2" type="number" step="any" value="1" placeholder="每單位工時" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"></label>
                <button type="button" class="absolute right-0 top-0 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-rose-500/15 hover:text-rose-300" onclick="removeGuidedProduct(this)" title="移除商品"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
        }

export function guidedResourceRow(name, op, limit) {
            return `<div class="guided-resource-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <label class="text-xs text-slate-400">資源名稱<input data-field="name" value="${name}" placeholder="例如：原料總量" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"></label>
                <label class="text-xs text-slate-400">限制條件<select data-field="op" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"><option value="<=">最多（≤）</option><option value=">=">至少（≥）</option><option value="=">剛好（＝）</option></select></label>
                <label class="text-xs text-slate-400 lg:col-span-2">可用上限／最低需求<input data-field="limit" type="number" step="any" value="${limit}" placeholder="請填數量" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"></label>
            </div>`;
        }

export function removeGuidedProduct(button) {
            const products = document.getElementById('guided-products');
            if (products.children.length <= 1) {
                showToast('至少需要保留一項商品。', 'warn');
                return;
            }
            button.closest('.guided-product-row')?.remove();
        }

export function addGuidedProduct() {
            const products = document.getElementById('guided-products');
            const index = products.children.length + 1;
            products.insertAdjacentHTML('beforeend', guidedProductRow(`產品 ${String.fromCharCode(64 + index)}`, 10));
        }

export function showGuidedResult(solution, title, summary) {
            const result = document.getElementById('guided-result');
            const values = document.getElementById('guided-result-values');
            document.getElementById('guided-result-title').textContent = title;
            document.getElementById('guided-result-summary').textContent = summary;
            if (!solution || solution.status !== 'optimal') {
                values.innerHTML = '<div class="text-sm text-amber-200">目前找不到符合所有條件的方案，請檢查限制是否互相衝突。</div>';
            } else {
                values.innerHTML = lpState.varNames.map((name, index) => `<div class="p-3 rounded-lg bg-slate-950/60"><div class="text-xs text-slate-400">${name}</div><div class="mt-1 text-xl font-bold text-white">${fmtNum(solution.x[index])}</div><div class="text-xs text-slate-500">建議數量</div></div>`).join('') + `<div class="p-3 rounded-lg bg-slate-950/60"><div class="text-xs text-slate-400">${lpState.type === 'max' ? '最大收益' : '最低成本'}</div><div class="mt-1 text-xl font-bold text-emerald-300">${fmtNum(solution.z)}</div></div>`;
            }
            result.classList.remove('hidden');
        }

export function renderGuidedTransportForm() {
            const { sources, destinations, costs } = guidedTransportFormState;
            const form = document.getElementById('guided-form');
            const fieldClass = 'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white';
            const sourceRows = sources.map((source, index) => `
                <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <label class="text-xs text-slate-400">供應地名稱
                        <input value="${escapeHtml(source.name)}" oninput="updateGuidedTransportField('source', ${index}, 'name', this.value)" placeholder="供應地名稱" class="${fieldClass}">
                    </label>
                    <label class="text-xs text-slate-400">可供應數量
                        <input type="number" min="0" step="any" value="${source.supply}" oninput="updateGuidedTransportField('source', ${index}, 'supply', this.value)" placeholder="可供應數量" class="${fieldClass}">
                    </label>
                    <button type="button" onclick="removeGuidedTransportLocation('source', ${index})" aria-label="刪除供應地" title="刪除供應地" class="rounded-md px-3 py-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"><i class="fa-solid fa-trash-can"></i></button>
                </div>`).join('');
            const destinationRows = destinations.map((destination, index) => `
                <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <label class="text-xs text-slate-400">需求地名稱
                        <input value="${escapeHtml(destination.name)}" oninput="updateGuidedTransportField('destination', ${index}, 'name', this.value)" placeholder="需求地名稱" class="${fieldClass}">
                    </label>
                    <label class="text-xs text-slate-400">需求數量
                        <input type="number" min="0" step="any" value="${destination.demand}" oninput="updateGuidedTransportField('destination', ${index}, 'demand', this.value)" placeholder="需求數量" class="${fieldClass}">
                    </label>
                    <button type="button" onclick="removeGuidedTransportLocation('destination', ${index})" aria-label="刪除需求地" title="刪除需求地" class="rounded-md px-3 py-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"><i class="fa-solid fa-trash-can"></i></button>
                </div>`).join('');
            const costHeaders = destinations.map(destination => `<th class="p-2">${escapeHtml(destination.name || '需求地')}</th>`).join('');
            const costRows = sources.map((source, sourceIndex) => `
                <tr>
                    <th class="text-left p-2 text-slate-300">${escapeHtml(source.name || '供應地')}</th>
                    ${destinations.map((destination, destinationIndex) => `
                        <td class="p-2">
                            <input type="number" min="0" step="any" value="${costs[sourceIndex][destinationIndex]}" oninput="updateGuidedTransportCost(${sourceIndex}, ${destinationIndex}, this.value)" aria-label="${escapeHtml(source.name)} 至 ${escapeHtml(destination.name)} 單位運費" class="w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm text-white">
                        </td>`).join('')}
                </tr>`).join('');

            form.innerHTML = `
                <div class="guided-form-card rounded-xl border border-slate-700 bg-slate-950/40 p-4 sm:p-5">
                    <h4 class="text-base font-semibold text-white">輸入配送資料</h4>
                    <p class="mt-1 text-xs text-slate-400">填寫供應量、需求量與每條路線的單位運費；供應地及需求地各可設定 1 至 5 個。</p>
                    <div class="grid lg:grid-cols-2 gap-5 mt-5">
                        <section>
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="text-sm font-medium text-cyan-200">供應地</h5>
                                <button type="button" onclick="addGuidedTransportLocation('source')" class="text-xs text-cyan-300 hover:text-cyan-200"><i class="fa-solid fa-plus mr-1"></i>新增供應地</button>
                            </div>
                            <div class="space-y-2">${sourceRows}</div>
                        </section>
                        <section>
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="text-sm font-medium text-cyan-200">需求地</h5>
                                <button type="button" onclick="addGuidedTransportLocation('destination')" class="text-xs text-cyan-300 hover:text-cyan-200"><i class="fa-solid fa-plus mr-1"></i>新增需求地</button>
                            </div>
                            <div class="space-y-2">${destinationRows}</div>
                        </section>
                    </div>
                    <div class="mt-5">
                        <h5 class="text-sm font-medium text-cyan-200 mb-2">每條路線的單位運費</h5>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm"><thead><tr class="text-xs text-slate-500"><th class="text-left p-2">從 / 到</th>${costHeaders}</tr></thead><tbody>${costRows}</tbody></table>
                        </div>
                    </div>
                    <button type="button" class="mt-5 w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-3 text-sm font-semibold text-white" onclick="solveGuidedTransportForm()"><i class="fa-solid fa-route mr-2"></i>計算最低配送成本</button>
                </div>`;
        }

export function updateGuidedTransportField(type, index, field, value) {
            const locations = type === 'source' ? guidedTransportFormState.sources : guidedTransportFormState.destinations;
            locations[index][field] = field === 'name' ? value : (Number(value) || 0);

            if (field === 'name') {
                const label = document.querySelectorAll(`#guided-form ${type === 'source' ? 'tbody tr th' : 'thead th'}`)[type === 'source' ? index : index + 1];
                if (label) label.textContent = value || (type === 'source' ? '供應地' : '需求地');
            }
        }

export function updateGuidedTransportCost(sourceIndex, destinationIndex, value) {
            guidedTransportFormState.costs[sourceIndex][destinationIndex] = Number(value) || 0;
        }

export function addGuidedTransportLocation(type) {
            const isSource = type === 'source';
            const locations = isSource ? guidedTransportFormState.sources : guidedTransportFormState.destinations;
            if (locations.length >= 5) {
                showToast(`最多可設定 5 個${isSource ? '供應地' : '需求地'}。`, 'warn');
                return;
            }

            if (isSource) {
                locations.push({ name: `供應地 ${locations.length + 1}`, supply: 200 });
                guidedTransportFormState.costs.push(guidedTransportFormState.destinations.map(() => 15));
            } else {
                locations.push({ name: `需求地 ${locations.length + 1}`, demand: 150 });
                guidedTransportFormState.costs.forEach(row => row.push(15));
            }
            renderGuidedTransportForm();
        }

export function removeGuidedTransportLocation(type, index) {
            const isSource = type === 'source';
            const locations = isSource ? guidedTransportFormState.sources : guidedTransportFormState.destinations;
            if (locations.length <= 1) {
                showToast(`至少需要保留一個${isSource ? '供應地' : '需求地'}。`, 'warn');
                return;
            }

            locations.splice(index, 1);
            if (isSource) {
                guidedTransportFormState.costs.splice(index, 1);
            } else {
                guidedTransportFormState.costs.forEach(row => row.splice(index, 1));
            }
            renderGuidedTransportForm();
        }

export function solveGuidedTransportForm() {
            const { sources, destinations, costs } = guidedTransportFormState;
            tpState = {
                numSources: sources.length,
                numDests: destinations.length,
                sourceNames: sources.map((source, index) => source.name.trim() || `供應地 ${index + 1}`),
                destNames: destinations.map((destination, index) => destination.name.trim() || `需求地 ${index + 1}`),
                supplies: sources.map(source => source.supply),
                demands: destinations.map(destination => destination.demand),
                costs: costs.map(row => [...row])
            };
            // Keep the same min-cost transport model for the result and the detail view.
            lpState = generateTransportLPModelObject();
            const solution = solveFullLPModel(lpState);
            const result = document.getElementById('guided-result');
            const totalSupply = tpState.supplies.reduce((total, value) => total + value, 0);
            const totalDemand = tpState.demands.reduce((total, value) => total + value, 0);
            const supplyDifference = totalSupply - totalDemand;
            document.getElementById('guided-result-title').textContent = '你的最低配送成本方案';
            document.getElementById('guided-result-summary').textContent = solution.status === 'optimal'
                ? `系統已滿足所有需求，並在不超過供應量的前提下找出最低總運費。${supplyDifference > 1e-9 ? `另有 ${fmtNum(supplyDifference)} 單位供應量未使用。` : ''}`
                : supplyDifference < -1e-9
                    ? `供應總量 ${fmtNum(totalSupply)} 小於需求總量 ${fmtNum(totalDemand)}，無法滿足所有需求。`
                    : `目前無法求得可行配送方案（${solution.status}），請檢查供應量、需求量及運費資料。`;
            document.getElementById('guided-result-values').innerHTML = solution.status === 'optimal'
                ? `<div class="p-3 rounded-lg bg-slate-950/60"><div class="text-xs text-slate-400">最低配送成本</div><div class="mt-1 text-xl font-bold text-emerald-300">$${fmtNum(solution.z)}</div></div><div class="p-3 rounded-lg bg-slate-950/60"><div class="text-xs text-slate-400">供應地</div><div class="mt-1 text-xl font-bold text-white">${tpState.numSources} 個</div></div><div class="p-3 rounded-lg bg-slate-950/60"><div class="text-xs text-slate-400">需求地</div><div class="mt-1 text-xl font-bold text-white">${tpState.numDests} 個</div></div>`
                : '<div class="text-sm text-amber-200">請確認供應量足以滿足所有需求。</div>';
            result.classList.remove('hidden');
        }

export function solveGuidedForm() {
            const productRows = [...document.querySelectorAll('.guided-product-row')];
            const resourceRows = [...document.querySelectorAll('.guided-resource-row')];
            const get = (row, field) => row.querySelector(`[data-field="${field}"]`).value.trim();
            const varNames = productRows.map((row, index) => get(row, 'name') || `方案 ${index + 1}`);
            const objCoeffs = productRows.map(row => Number(get(row, 'value')) || 0);
            const constraints = resourceRows.map((row, resourceIndex) => ({ name: get(row, 'name') || `限制 ${resourceIndex + 1}`, coeffs: productRows.map(row => Number(get(row, `resource-${resourceIndex + 1}`)) || 0), op: get(row, 'op'), rhs: Number(get(row, 'limit')) || 0 }));
            lpState = { type: document.getElementById('guided-objective-type').value, unit: '自訂單位', numVars: varNames.length, varNames, varTypes: varNames.map(() => 'cont'), objCoeffs, constraints };
            renderAllGeneralLPInputs();
            solveCurrentLP();
            showGuidedResult(lastSolution, lpState.type === 'max' ? '你的最佳分配方案' : '你的最低成本方案', lpState.type === 'max' ? '系統已在你設定的資源限制內，找出收益最大的安排。' : '系統已在你設定的條件下，找出成本最低的安排。');
        }

export function startGuidedScenario(key) {
            guidedScenario = key;
            setWorkspaceNavigationVisible(true);
            setSidebarActive('input');
            const guidedObjectiveTypes = {
                allocation: 'max',
                cost: 'min',
                transport: 'min',
                assignment: 'min',
                blending: 'min'
            };
            if (guidedObjectiveTypes[key] && key !== 'transport') {
                lpState.type = guidedObjectiveTypes[key];
                renderAllGeneralLPInputs();
                solveCurrentLP();
            }
            const data = guidedScenarioData[key];
            const modelValue = document.getElementById('current-model-value');
            if (modelValue) {
                modelValue.textContent = window.getModelDisplayName(key);
            }
            document.getElementById('guided-picker').classList.add('hidden');
            document.getElementById('guided-details').classList.remove('hidden');
            document.getElementById('guided-kicker').textContent = key === 'unsure' ? '先做判斷' : '你選擇的是';
            document.getElementById('guided-title').textContent = data.title;
            document.getElementById('guided-description').textContent = data.description;
            document.getElementById('guided-questions').innerHTML = data.questions.map((question, index) => `
                <div class="flex gap-2 items-start"><span class="text-cyan-300 font-mono">${index + 1}.</span><span>${question}</span></div>
            `).join('');
            document.getElementById('guided-unknown').classList.toggle('hidden', key !== 'unsure');
            document.getElementById('guided-example-button').classList.toggle('hidden', key === 'unsure');
            document.getElementById('guided-result').classList.add('hidden');
            renderGuidedForm(key);
            if (key !== 'allocation' && key !== 'transport') {
                document.querySelectorAll('#guided-resources select[data-field="op"]').forEach(select => {
                    select.value = '>=';
                });
            }
        }

export function resetGuidedPicker() {
            guidedScenario = null;
            setWorkspaceNavigationVisible(false);
            document.getElementById('guided-picker').classList.remove('hidden');
            document.getElementById('guided-details').classList.add('hidden');
            document.getElementById('guided-form').innerHTML = '';
            document.getElementById('guided-result').classList.add('hidden');
        }

export function useGuidedExample() {
            if (!guidedScenario || guidedScenario === 'unsure') return;
            if (guidedScenario === 'transport') {
                solveGuidedTransportForm();
                return;
            }
            const presetMap = { allocation: 'hw_default', cost: 'min_cost', assignment: 'integer_demo', blending: 'sensitivity_demo' };
            loadPreset(presetMap[guidedScenario]);
            switchMainTab('general');
            showToast('已載入範例。接下來可以把產品名稱、收益與限制換成自己的資料。', 'success');
        }

if (typeof window !== 'undefined') {
    Object.assign(window, { renderGuidedForm, guidedProductRow, guidedResourceRow, removeGuidedProduct, addGuidedProduct, showGuidedResult, renderGuidedTransportForm, updateGuidedTransportField, updateGuidedTransportCost, addGuidedTransportLocation, removeGuidedTransportLocation, solveGuidedTransportForm, solveGuidedForm, startGuidedScenario, resetGuidedPicker, useGuidedExample });
}
