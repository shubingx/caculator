import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNaturalLanguageToModel } from '../../src/features/ai-parser/parser.js';

test('parses objective coefficients and unicode inequalities', () => {
    const model = parseNaturalLanguageToModel(
        '最小化採購成本：原料甲成本 5 元，原料乙成本 8 元。2x1 + 3x2 ≥ 18，x1 + x2 <= 7。'
    );

    assert.equal(model.type, 'min');
    assert.deepEqual(model.objCoeffs, [5, 8]);
    assert.deepEqual(model.constraints.map(constraint => constraint.op), ['>=', '<=']);
    assert.deepEqual(model.constraints.map(constraint => constraint.coeffs), [[2, 3], [1, 1]]);
});

test('retains the established example model when no constraints are recognized', () => {
    const model = parseNaturalLanguageToModel('最大化收益，產品A 20 元，產品B 15 元。');

    assert.equal(model.type, 'max');
    assert.deepEqual(model.objCoeffs, [20, 15]);
    assert.equal(model.constraints.length, 2);
});
