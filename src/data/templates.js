export const templates = Object.freeze({
    assignment: {
        model: {
            type: 'min',
            unit: '小時 (總執行工時)',
            numVars: 4,
            varNames: ['人員1→任務A', '人員1→任務B', '人員2→任務A', '人員2→任務B'],
            varTypes: ['bin', 'bin', 'bin', 'bin'],
            objCoeffs: [8, 6, 5, 9],
            constraints: [
                { name: '人員1指派限制', coeffs: [1, 1, 0, 0], op: '=', rhs: 1 },
                { name: '人員2指派限制', coeffs: [0, 0, 1, 1], op: '=', rhs: 1 },
                { name: '任務A指派限制', coeffs: [1, 0, 1, 0], op: '=', rhs: 1 },
                { name: '任務B指派限制', coeffs: [0, 1, 0, 1], op: '=', rhs: 1 }
            ]
        },
        message: '已載入「0-1 指派問題 (Assignment Problem)」範本並完成求解！'
    },
    blending: {
        model: {
            type: 'min',
            unit: '元 (每批次飼料成本)',
            numVars: 2,
            varNames: ['穀物原料A(kg)', '大豆原料B(kg)'],
            varTypes: ['cont', 'cont'],
            objCoeffs: [12, 18],
            constraints: [
                { name: '蛋白質最低需求(g)', coeffs: [3, 6], op: '>=', rhs: 36 },
                { name: '維生素最低需求(mg)', coeffs: [4, 2], op: '>=', rhs: 28 },
                { name: '鈣質最低需求(g)', coeffs: [2, 2], op: '>=', rhs: 18 }
            ]
        },
        message: '已載入「混合配料問題 (Blending Problem)」範本並完成求解！'
    },
    production: {
        model: {
            type: 'max',
            unit: '千元 (總利潤)',
            numVars: 3,
            varNames: ['標準型產品', '進階型產品', '旗艦型產品'],
            varTypes: ['cont', 'cont', 'cont'],
            objCoeffs: [30, 50, 80],
            constraints: [
                { name: '機台加工工時', coeffs: [2, 3, 5], op: '<=', rhs: 150 },
                { name: '人工組裝工時', coeffs: [1, 2, 3], op: '<=', rhs: 95 },
                { name: '關鍵零組件配額', coeffs: [1, 1, 2], op: '<=', rhs: 60 }
            ]
        },
        message: '已載入「多產品生產計劃與資源配置」範本並完成求解！'
    }
});

export const templateKeys = Object.freeze(Object.keys(templates));
