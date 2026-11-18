export function parseObjectiveType(text) {
    const isMin = /最小|最低|成本|min/i.test(text) && !/最大|最高|max/i.test(text);
    return isMin ? 'min' : 'max';
}

export function parseNaturalLanguageToModel(text) {
    const type = parseObjectiveType(text);
    const constraintPattern = /([+-]?\s*\d*\.?\d*)\s*\*?\s*(?:x_?1|x₁|產品A|原料甲)\s*([+-]\s*\d*\.?\d*)\s*\*?\s*(?:x_?2|x₂|產品B|原料乙)\s*(<=|>=|=|≤|≥)\s*([+-]?\d+\.?\d*)/gi;
    const constraints = [];
    let match;

    while ((match = constraintPattern.exec(text)) !== null) {
        const parseCoefficient = value => {
            const coefficient = value.replace(/\s+/g, '');
            if (coefficient === '' || coefficient === '+') return 1;
            if (coefficient === '-') return -1;
            return Number.parseFloat(coefficient) || 0;
        };
        const operator = match[3] === '≤' ? '<=' : match[3] === '≥' ? '>=' : match[3];
        constraints.push({
            name: `AI解析限制式 ${constraints.length + 1}`,
            coeffs: [parseCoefficient(match[1]), parseCoefficient(match[2])],
            op: operator,
            rhs: Number.parseFloat(match[4]) || 0
        });
    }

    const objectiveAmounts = text.match(/(\d+(?:\.\d+)?)\s*元/g);
    const objCoeffs = objectiveAmounts?.length >= 2
        ? objectiveAmounts.slice(0, 2).map(amount => Number.parseFloat(amount))
        : [20, 15];

    if (constraints.length === 0) {
        constraints.push(
            { name: '資源限制 1', coeffs: [2, 1], op: '<=', rhs: 20 },
            { name: '資源限制 2', coeffs: [1, 3], op: '<=', rhs: 35 }
        );
    }

    const isMin = type === 'min';
    return {
        type,
        unit: isMin ? '元 (成本)' : '元 (利潤)',
        numVars: 2,
        varNames: isMin ? ['原料甲', '原料乙'] : ['產品A', '產品B'],
        varTypes: ['cont', 'cont'],
        objCoeffs,
        constraints
    };
}

export function parseSimpleTwoVariableModel(text) {
    return {
        type: parseObjectiveType(text),
        sourceText: text,
        supported: /x\s*1|x_?1/i.test(text) && /x\s*2|x_?2/i.test(text)
    };
}
