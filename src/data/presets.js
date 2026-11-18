export const presets = Object.freeze({
    hw_default: {
        model: {
            type: 'max',
            unit: '元 (利潤)',
            numVars: 2,
            varNames: ['產品A', '產品B'],
            varTypes: ['cont', 'cont'],
            objCoeffs: [20, 15],
            constraints: [
                { name: '原料限制', coeffs: [2, 1], op: '<=', rhs: 20 },
                { name: '人力限制', coeffs: [1, 3], op: '<=', rhs: 35 }
            ]
        },
        message: '已載入作業預設生產問題 (最佳解 x₁*=5, x₂*=10, Z*=250)',
        type: 'info'
    },
    min_cost: {
        model: {
            type: 'min',
            unit: '元 (成本)',
            numVars: 2,
            varNames: ['方案甲', '方案乙'],
            varTypes: ['cont', 'cont'],
            objCoeffs: [5, 8],
            constraints: [
                { name: '基本產出需求', coeffs: [2, 3], op: '>=', rhs: 18 },
                { name: '品質綜合指標', coeffs: [1, 1], op: '>=', rhs: 7 }
            ]
        },
        message: '已載入最小化成本案例 (Min Z = 5x₁ + 8x₂)',
        type: 'info'
    },
    sensitivity_demo: {
        model: {
            type: 'max',
            unit: '元 (利潤)',
            numVars: 2,
            varNames: ['產品A', '產品B'],
            varTypes: ['cont', 'cont'],
            objCoeffs: [40, 30],
            constraints: [
                { name: '預算限制', coeffs: [1, 1], op: '<=', rhs: 12 },
                { name: '人力限制', coeffs: [2, 1], op: '<=', rhs: 16 },
                { name: '產能限制', coeffs: [1, 0], op: '<=', rhs: 6 }
            ]
        },
        message: '已載入緊束與敏感度展示案例 (Max Z = 40x₁ + 30x₂)',
        type: 'info'
    },
    three_vars: {
        model: {
            type: 'max',
            unit: '千元 (總毛利)',
            numVars: 3,
            varNames: ['高階機種', '標準機種', '輕量機種'],
            varTypes: ['cont', 'cont', 'cont'],
            objCoeffs: [50, 40, 30],
            constraints: [
                { name: 'SMT產線工時', coeffs: [3, 2, 1], op: '<=', rhs: 120 },
                { name: '晶片配額上限', coeffs: [2, 2, 1], op: '<=', rhs: 90 },
                { name: '品管測試工時', coeffs: [1, 2, 3], op: '<=', rhs: 110 }
            ]
        },
        message: '已載入 3 變數生產資源配置問題',
        type: 'info'
    },
    integer_demo: {
        model: {
            type: 'max',
            unit: '萬元 (淨現值)',
            numVars: 2,
            varNames: ['精密機台A', '自動化機台B'],
            varTypes: ['int', 'int'],
            objCoeffs: [8, 5],
            constraints: [
                { name: '資本預算上限', coeffs: [1, 1], op: '<=', rhs: 6 },
                { name: '廠房面積限制', coeffs: [9, 5], op: '<=', rhs: 45 }
            ]
        },
        message: '已載入整數規劃 (IP) 案例：決策變數限定為整數',
        type: 'info'
    },
    infeasible: {
        model: {
            type: 'max',
            unit: '元',
            numVars: 2,
            varNames: ['產品A', '產品B'],
            varTypes: ['cont', 'cont'],
            objCoeffs: [10, 15],
            constraints: [
                { name: '產能上限', coeffs: [1, 1], op: '<=', rhs: 10 },
                { name: '硬性訂單最低要求', coeffs: [1, 1], op: '>=', rhs: 20 }
            ]
        },
        message: '已載入無可行解 (Infeasible) 測試案例',
        type: 'warn'
    },
    unbounded: {
        model: {
            type: 'max',
            unit: '元',
            numVars: 2,
            varNames: ['投機部位A', '投機部位B'],
            varTypes: ['cont', 'cont'],
            objCoeffs: [10, 20],
            constraints: [
                { name: '最低部位要求', coeffs: [1, 1], op: '>=', rhs: 5 },
                { name: '比例限制', coeffs: [-1, 1], op: '<=', rhs: 10 }
            ]
        },
        message: '已載入無界解 (Unbounded) 測試案例',
        type: 'warn'
    }
});

export const presetKeys = Object.freeze(Object.keys(presets));
