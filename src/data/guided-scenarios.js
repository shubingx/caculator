export const guidedScenarioData = Object.freeze({
    allocation: {
        title: '分配有限資源',
        description: '適合生產、投資或排程問題：你有一些有限的資源，要決定怎麼分配才能得到最大收益。',
        questions: ['你可以調整哪些數量？', '每個選項能帶來多少收益？', '原料、預算或工時有多少？'],
        model: 'linear-programming',
        objective: 'max',
        displayName: '資源配置模型（線性規劃 LP）'
    },
    cost: {
        title: '用最低成本達成需求',
        description: '適合採購、配方或營養問題：你必須達到某些要求，同時希望總成本最低。',
        questions: ['你需要達到哪些要求？', '有哪些可選的材料或方案？', '每個方案的成本與上限是多少？'],
        model: 'linear-programming',
        objective: 'min',
        displayName: '成本最小化模型（線性規劃 LP）'
    },
    transport: {
        title: '安排運送與配送',
        description: '適合倉庫、工廠與門市之間的配送：系統會同時考慮供應量、需求量與運費。',
        questions: ['有哪些供應地？', '每個需求地需要多少？', '不同路線的單位運費是多少？'],
        model: 'transportation',
        objective: 'min',
        displayName: '運輸模型（運輸問題 LP）'
    },
    assignment: {
        title: '安排人員或工作',
        description: '適合把人員、機器或任務互相配對，讓總成本、時間或距離最小。',
        questions: ['有哪些人員或資源？', '有哪些工作或任務？', '每個配對的成本或時間是多少？'],
        model: 'binary-integer-programming',
        objective: 'min',
        displayName: '指派模型（0-1 整數規劃）'
    },
    blending: {
        title: '混合原料或配方',
        description: '適合配方、飼料或產品混合問題：在符合成分要求的前提下，找出最省成本的組合。',
        questions: ['有哪些原料可以使用？', '每種原料的成本是多少？', '各項成分至少或至多需要多少？'],
        model: 'linear-programming',
        objective: 'min',
        displayName: '混合模型（線性規劃 LP）'
    },
    unsure: {
        title: '先判斷問題是否適合最佳化',
        description: '如果你可以調整一些數量，並且希望結果最好，同時不能違反一些條件，通常就可以建立最佳化模型。',
        questions: ['你正在做哪一種選擇？', '什麼結果算是「最好」？', '有哪些條件不能違反？'],
        model: null,
        objective: null,
        displayName: '尚未選定，請先描述你的問題'
    }
});

export const guidedScenarioKeys = Object.freeze(Object.keys(guidedScenarioData));

export const guidedScenarioModels = Object.freeze(Object.fromEntries(
    guidedScenarioKeys.map(key => [key, {
        model: guidedScenarioData[key].model,
        objective: guidedScenarioData[key].objective
    }])
));
