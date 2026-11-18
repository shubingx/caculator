import { solveContinuousLP } from './lp-solver.js';
const MAX_NODES = 250;

export function solveFullLPModel(modelInput, maxNodes = MAX_NODES) {
            // 深拷貝模型
            const baseModel = JSON.parse(JSON.stringify(modelInput));
            const n = baseModel.numVars;

            // 若有 0-1 二元變數，自動補上 x_i <= 1 的內部邊界限制
            for (let i = 0; i < n; i++) {
                if (baseModel.varTypes[i] === 'bin') {
                    let coeffs = new Array(n).fill(0);
                    coeffs[i] = 1;
                    baseModel.constraints.push({
                        name: `_bin_bound_${i}`,
                        coeffs,
                        op: '<=',
                        rhs: 1,
                        isExtraBound: true
                    });
                }
            }

            const hasIntOrBin = baseModel.varTypes.some(t => t === 'int' || t === 'bin');
            if (!hasIntOrBin) {
                return solveContinuousLP(baseModel);
            }

            // 若包含整數或 0-1 變數，先求 LP Relaxation，再進行 Branch & Bound
            const rootSol = solveContinuousLP(baseModel);
            if (rootSol.status !== 'optimal') {
                return rootSol;
            }

            const isMax = baseModel.type === 'max';
            let bestZ = isMax ? -Infinity : Infinity;
            let bestSol = null;
            let totalIter = 0;

            let queue = [baseModel];
            let nodesExplored = 0;
            while (queue.length > 0 && nodesExplored < maxNodes) {
                const currModel = queue.pop();
                nodesExplored++;

                const sol = solveContinuousLP(currModel);
                totalIter += sol.iterations || 1;

                if (sol.status !== 'optimal') continue;

                // Bound 剪枝
                if (isMax && sol.z <= bestZ + 1e-7) continue;
                if (!isMax && sol.z >= bestZ - 1e-7) continue;

                // 檢查所有整數/二元變數是否已為整數
                let fracVarIdx = -1;
                for (let i = 0; i < n; i++) {
                    if (currModel.varTypes[i] === 'int' || currModel.varTypes[i] === 'bin') {
                        const val = sol.x[i];
                        if (Math.abs(val - Math.round(val)) > 1e-5) {
                            fracVarIdx = i;
                            break;
                        }
                    }
                }

                if (fracVarIdx === -1) {
                    // 找到可行整數解
                    if ((isMax && sol.z > bestZ) || (!isMax && sol.z < bestZ)) {
                        bestZ = sol.z;
                        bestSol = sol;
                    }
                } else {
                    // 分支 (Branching): x_i <= floor(val) 與 x_i >= ceil(val)
                    const val = sol.x[fracVarIdx];
                    const floorVal = Math.floor(val);
                    const ceilVal = Math.ceil(val);

                    let leftModel = JSON.parse(JSON.stringify(currModel));
                    let cLeft = new Array(n).fill(0);
                    cLeft[fracVarIdx] = 1;
                    leftModel.constraints.push({
                        name: `_bb_le_${fracVarIdx}`,
                        coeffs: cLeft,
                        op: '<=',
                        rhs: floorVal,
                        isExtraBound: true
                    });

                    let rightModel = JSON.parse(JSON.stringify(currModel));
                    let cRight = new Array(n).fill(0);
                    cRight[fracVarIdx] = 1;
                    rightModel.constraints.push({
                        name: `_bb_ge_${fracVarIdx}`,
                        coeffs: cRight,
                        op: '>=',
                        rhs: ceilVal,
                        isExtraBound: true
                    });

                    queue.push(leftModel);
                    queue.push(rightModel);
                }
            }

            const truncated = queue.length > 0;
            if (!bestSol) {
                return {
                    status: truncated ? 'limit' : 'infeasible',
                    iterations: totalIter,
                    truncated
                };
            }

            // 以原始 LP Relaxation 的對偶影子價格補充說明，並更新整數最佳解之 LHS 與 Slack
            bestSol.x = bestSol.x.map((v, i) => (baseModel.varTypes[i] === 'int' || baseModel.varTypes[i] === 'bin') ? Math.round(v) : v);
            bestSol.iterations = totalIter;
            bestSol.isIntegerOptimal = !truncated;
            if (truncated) {
                bestSol.status = 'limit';
                bestSol.truncated = true;
            }
            return bestSol;
        }