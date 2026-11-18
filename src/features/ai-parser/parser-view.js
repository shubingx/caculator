import { parseNaturalLanguageToModel } from './parser.js';
export function fillAIPromptSample(sampleId) {
            const box = document.getElementById('ai-nlp-input');
            if (sampleId === 1) {
                box.value = '某工廠生產產品A與產品B。產品A每單位利潤20元，產品B每單位利潤15元。原料限制為 2x1 + 1x2 <= 20，工時限制為 1x1 + 3x2 <= 35，求最大利潤。';
            } else {
                box.value = '最小化採購成本：原料甲每公斤成本 5 元，原料乙每公斤成本 8 元。營養素限制 2x1 + 3x2 >= 18，重量限制 1x1 + 1x2 >= 7。';
            }
        }

export function parseNaturalLanguageToLP() {
            const text = document.getElementById('ai-nlp-input').value.trim();
            if (!text) {
                showToast('請先輸入自然語言問題描述', 'warn');
                return;
            }

            const model = parseNaturalLanguageToModel(text);
            lpState = model;

            const feedback = document.getElementById('ai-parse-feedback');
            feedback.classList.remove('hidden');
            feedback.innerHTML = `
                <div class="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check"></i> AI 語意建模完成！已自動轉換為標準線性規劃模型並完成求解。
                </div>
                <div class="text-slate-300 font-mono">
                    識別類型：${model.type.toUpperCase()} | 目標係數：[${model.objCoeffs.join(', ')}] | 限制式數量：${model.constraints.length} 條
                </div>
            `;

            renderAllGeneralLPInputs();
            solveCurrentLP();
            switchMainTab('general');
            showToast('AI 已完成自然語言解析並載入模型求解！', 'success');
        }

if (typeof window !== 'undefined') {
    Object.assign(window, { fillAIPromptSample, parseNaturalLanguageToLP });
}
