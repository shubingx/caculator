export const appState = {
    lpState: {
        type: 'max',
        unit: '元 (利潤)',
        numVars: 2,
        varNames: ['產品A', '產品B'],
        varTypes: ['cont', 'cont'],
        objCoeffs: [20, 15],
        constraints: [
            { name: '原料限制', coeffs: [2, 1], op: '<=', rhs: 20 },
            { name: '工時限制', coeffs: [1, 3], op: '<=', rhs: 35 }
        ]
    },
    lastSolution: null,
    tpState: {
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
    guidedScenario: null
};

if (typeof window !== 'undefined') {
    for (const key of Object.keys(appState)) {
        Object.defineProperty(window, key, {
            configurable: true,
            get: () => appState[key],
            set: value => {
                appState[key] = value;
            }
        });
    }
}
