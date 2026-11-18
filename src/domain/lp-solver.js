export function solveContinuousLP(model) {
            const EPS = 1e-8;
            const isMax = model.type === 'max';
            const nOrig = model.numVars;

            // 1. 處理自由變數 (Free Variables): x_i = x_i^+ - x_i^-
            // 每個原始變數對應到標準型變數索引
            let varMap = [];
            let stdObj = [];
            for (let i = 0; i < nOrig; i++) {
                const c = isMax ? (model.objCoeffs[i] || 0) : -(model.objCoeffs[i] || 0);
                if (model.varTypes[i] === 'free') {
                    const posIdx = stdObj.length;
                    stdObj.push(c);
                    const negIdx = stdObj.length;
                    stdObj.push(-c);
                    varMap.push({ type: 'free', posIdx, negIdx });
                } else {
                    const idx = stdObj.length;
                    stdObj.push(c);
                    varMap.push({ type: 'nonneg', idx });
                }
            }

            const nDecisionCols = stdObj.length;

            // 2. 整理所有限制式 (包含原始限制式 + 二元變數 x_i <= 1 或 B&B 附加邊界限制)
            let rawConstraints = [];
            model.constraints.forEach((c, idx) => {
                let rowCoeffs = new Array(nDecisionCols).fill(0);
                for (let i = 0; i < nOrig; i++) {
                    const val = c.coeffs[i] || 0;
                    if (varMap[i].type === 'free') {
                        rowCoeffs[varMap[i].posIdx] = val;
                        rowCoeffs[varMap[i].negIdx] = -val;
                    } else {
                        rowCoeffs[varMap[i].idx] = val;
                    }
                }
                rawConstraints.push({
                    origIndex: idx,
                    isExtraBound: Boolean(c.isExtraBound),
                    coeffs: rowCoeffs,
                    op: c.op,
                    rhs: c.rhs
                });
            });

            const m = rawConstraints.length;

            // 3. 將每條限制式正規化為 RHS >= 0，並記錄是否翻轉符號 (影響對偶影子價格正負號)
            let normConstraints = rawConstraints.map(c => {
                let coeffs = [...c.coeffs];
                let op = c.op;
                let rhs = c.rhs;
                let flipped = false;
                if (rhs < -EPS) {
                    rhs = -rhs;
                    coeffs = coeffs.map(v => -v);
                    if (op === '<=') op = '>=';
                    else if (op === '>=') op = '<=';
                    flipped = true;
                } else if (Math.abs(rhs) <= EPS) {
                    rhs = 0;
                }
                return { ...c, coeffs, op, rhs, flipped };
            });

            // 4. 加入鬆弛變數 (Slack)、剩餘變數 (Surplus) 與人工變數 (Artificial)
            let totalCols = nDecisionCols;
            let slackCols = new Array(m).fill(-1);
            let artificialCols = [];
            let basis = new Array(m).fill(-1);

            normConstraints.forEach((c, r) => {
                if (c.op === '<=') {
                    slackCols[r] = totalCols;
                    basis[r] = totalCols;
                    totalCols++;
                } else if (c.op === '>=') {
                    slackCols[r] = totalCols; // surplus (-1)
                    totalCols++;
                    const artCol = totalCols;
                    artificialCols.push({ row: r, col: artCol });
                    basis[r] = artCol;
                    totalCols++;
                } else if (c.op === '=') {
                    const artCol = totalCols;
                    artificialCols.push({ row: r, col: artCol });
                    basis[r] = artCol;
                    totalCols++;
                }
            });

            // 建立單形表 (Simplex Tableau): m 列限制式 + 2 列目標列 (Row m: Phase 2 目標; Row m+1: Phase 1 目標)
            let tableau = [];
            for (let r = 0; r < m; r++) {
                let row = new Array(totalCols + 1).fill(0);
                const c = normConstraints[r];
                for (let j = 0; j < nDecisionCols; j++) {
                    row[j] = c.coeffs[j];
                }
                if (c.op === '<=') {
                    row[slackCols[r]] = 1;
                } else if (c.op === '>=') {
                    row[slackCols[r]] = -1;
                }
                row[totalCols] = c.rhs;
                tableau.push(row);
            }

            artificialCols.forEach(art => {
                tableau[art.row][art.col] = 1;
            });

            // Row m: Phase 2 Objective Row (初始設定為 -c_j，最大化標準型 z - c^T x = 0)
            let phase2Row = new Array(totalCols + 1).fill(0);
            for (let j = 0; j < nDecisionCols; j++) {
                phase2Row[j] = -stdObj[j];
            }
            tableau.push(phase2Row);

            // Row m+1: Phase 1 Objective Row (最小化 sum a_i <=> 最大化 W = -sum a_i, W + sum a_i = 0)
            let phase1Row = new Array(totalCols + 1).fill(0);
            artificialCols.forEach(art => {
                phase1Row[art.col] = 1;
            });
            tableau.push(phase1Row);

            // 消去人工變數在 Phase 1 目標列之基底係數
            artificialCols.forEach(art => {
                const r = art.row;
                for (let j = 0; j <= totalCols; j++) {
                    tableau[m + 1][j] -= tableau[r][j];
                }
            });

            let iterations = 0;
            const MAX_ITER = 600;

            // 單形法樞軸迭代函式 (Bland's Rule 防循環)
            function runSimplexPhase(objRowIdx, isPhase1) {
                while (iterations < MAX_ITER) {
                    // 尋找進入變數 (Entering Variable): 目標列中係數最負者
                    let pivotCol = -1;
                    let minCoeff = -1e-7;

                    for (let j = 0; j < totalCols; j++) {
                        // Phase 2 時禁止人工變數進入基底
                        if (!isPhase1 && artificialCols.some(a => a.col === j)) continue;
                        const val = tableau[objRowIdx][j];
                        if (val < minCoeff) {
                            minCoeff = val;
                            pivotCol = j;
                        }
                    }

                    // 已達最佳條件
                    if (pivotCol === -1) {
                        return 'optimal';
                    }

                    // 最小比值檢驗 (Minimum Ratio Test) 尋找離開變數 (Leaving Variable)
                    let pivotRow = -1;
                    let minRatio = Infinity;

                    for (let r = 0; r < m; r++) {
                        const a_ij = tableau[r][pivotCol];
                        if (a_ij > 1e-7) {
                            const ratio = tableau[r][totalCols] / a_ij;
                            if (ratio < minRatio - 1e-9 || (Math.abs(ratio - minRatio) <= 1e-9 && basis[r] > basis[pivotRow])) {
                                minRatio = ratio;
                                pivotRow = r;
                            }
                        }
                    }

                    if (pivotRow === -1) {
                        return 'unbounded';
                    }

                    // 執行高斯消去樞軸運算 (Pivot Operation)
                    const pivotVal = tableau[pivotRow][pivotCol];
                    for (let j = 0; j <= totalCols; j++) {
                        tableau[pivotRow][j] /= pivotVal;
                    }

                    for (let r = 0; r <= m + 1; r++) {
                        if (r === pivotRow) continue;
                        const factor = tableau[r][pivotCol];
                        if (Math.abs(factor) > 1e-11) {
                            for (let j = 0; j <= totalCols; j++) {
                                tableau[r][j] -= factor * tableau[pivotRow][j];
                            }
                        }
                    }

                    basis[pivotRow] = pivotCol;
                    iterations++;
                }
                return 'max_iter';
            }

            // 執行第一階段 (Phase 1)
            if (artificialCols.length > 0) {
                const status1 = runSimplexPhase(m + 1, true);
                const wVal = tableau[m + 1][totalCols];
                if (status1 !== 'optimal' || Math.abs(wVal) > 1e-5) {
                    return { status: 'infeasible', iterations };
                }

                // 若人工變數仍在基底且值為0，嘗試將其替換出基底
                for (let r = 0; r < m; r++) {
                    if (artificialCols.some(a => a.col === basis[r])) {
                        for (let j = 0; j < nDecisionCols + m; j++) {
                            if (!artificialCols.some(a => a.col === j) && Math.abs(tableau[r][j]) > 1e-6) {
                                const pivotVal = tableau[r][j];
                                for (let k = 0; k <= totalCols; k++) tableau[r][k] /= pivotVal;
                                for (let rowIdx = 0; rowIdx <= m; rowIdx++) {
                                    if (rowIdx === r) continue;
                                    const factor = tableau[rowIdx][j];
                                    for (let k = 0; k <= totalCols; k++) tableau[rowIdx][k] -= factor * tableau[r][k];
                                }
                                basis[r] = j;
                                break;
                            }
                        }
                    }
                }
            }

            // 執行第二階段 (Phase 2)
            const status2 = runSimplexPhase(m, false);
            if (status2 === 'unbounded') {
                return { status: 'unbounded', iterations };
            }

            // 5. 萃取決策變數最佳解 x*
            let stdVarVals = new Array(totalCols).fill(0);
            for (let r = 0; r < m; r++) {
                stdVarVals[basis[r]] = tableau[r][totalCols];
            }

            let xOpt = new Array(nOrig).fill(0);
            for (let i = 0; i < nOrig; i++) {
                if (varMap[i].type === 'free') {
                    xOpt[i] = stdVarVals[varMap[i].posIdx] - stdVarVals[varMap[i].negIdx];
                } else {
                    xOpt[i] = stdVarVals[varMap[i].idx];
                }
            }

            const maxZ = tableau[m][totalCols];
            const zOpt = isMax ? maxZ : -maxZ;

            // 6. 計算每條原始限制式之 LHS、Slack/Surplus、Binding 狀態與對偶影子價格 (Shadow Price)
            // 原理：在最終單形表第 m 列 (Phase 2 目標列) 中，初始基底欄位 (對應第 r 條正規化限制式之 Slack 或 Artificial 變數)
            // 其係數即為 c_B B^{-1} e_r (最大化問題之對偶變數 y_r)
            let constraintAnalysis = [];
            normConstraints.forEach((nc, r) => {
                if (nc.isExtraBound) return; // 略過分支界限法附加之內部邊界

                const origC = model.constraints[nc.origIndex];
                let lhs = 0;
                for (let i = 0; i < nOrig; i++) {
                    lhs += (origC.coeffs[i] || 0) * xOpt[i];
                }
                const rhs = origC.rhs;
                const diff = Math.abs(rhs - lhs);
                const isBinding = diff <= 1e-5;

                // 取出第 r 條正規化限制式對應之初始單位矩陣欄位 (Identity column)
                let idCol = -1;
                let colSign = 1; // 若初始欄位為 +1，則表內目標列係數為 +c_B B^{-1} e_r
                if (nc.op === '<=') {
                    idCol = slackCols[r];
                    colSign = 1;
                } else {
                    const artObj = artificialCols.find(a => a.row === r);
                    idCol = artObj ? artObj.col : -1;
                    colSign = 1;
                }

                let shadowPrice = 0;
                if (idCol !== -1) {
                    // 對 max Z 而言，dZ_max / d(b_norm) = tableau[m][idCol] * colSign
                    let dZmax_dbnorm = tableau[m][idCol] * colSign;
                    // 若為 min Z，Z_min = -Z_max
                    let dZ_dbnorm = isMax ? dZmax_dbnorm : -dZmax_dbnorm;
                    // 若正規化時因為負 RHS 乘過 -1，則 d(b_norm)/d(b_orig) = -1
                    shadowPrice = nc.flipped ? -dZ_dbnorm : dZ_dbnorm;
                }

                if (Math.abs(shadowPrice) < 1e-8) shadowPrice = 0;

                constraintAnalysis.push({
                    index: nc.origIndex,
                    name: origC.name || `限制式 ${nc.origIndex + 1}`,
                    op: origC.op,
                    coeffs: origC.coeffs,
                    lhs: lhs,
                    rhs: rhs,
                    slack: diff,
                    isBinding: isBinding,
                    shadowPrice: shadowPrice
                });
            });

            return {
                status: 'optimal',
                z: zOpt,
                x: xOpt,
                iterations,
                constraints: constraintAnalysis
            };
        }

        /**
         * 整合求解入口：自動處理連續線性規劃 (LP) 與整數/二元規劃 (MIP Branch & Bound)
         */