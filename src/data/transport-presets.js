export const transportPresets = Object.freeze({
    pdf_example: {
        state: {
            numSources: 3,
            numDests: 4,
            sourceNames: ['S1', 'S2', 'S3'],
            destNames: ['A', 'B', 'C', 'D'],
            supplies: [300, 300, 200],
            demands: [150, 250, 200, 200],
            costs: [
                [16, 18, 11, 20],
                [14, 12, 13, 17],
                [13, 15, 17, 18]
            ]
        },
        message: '已載入作業 PDF 運輸問題範例 (3供給地 × 4需求地)'
    },
    unbalanced: {
        state: {
            numSources: 3,
            numDests: 4,
            sourceNames: ['S1', 'S2', 'S3'],
            destNames: ['A', 'B', 'C', 'D'],
            supplies: [400, 300, 200],
            demands: [150, 250, 200, 200],
            costs: [
                [16, 18, 11, 20],
                [14, 12, 13, 17],
                [13, 15, 17, 18]
            ]
        },
        message: '已載入供過於求案例 (總供給 900 > 總需求 800，展示倉庫剩餘供應量)'
    }
});
