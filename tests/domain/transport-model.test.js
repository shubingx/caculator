import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransportModel, isBalancedTransport } from '../../src/domain/transport-model.js';

const state = {
    numSources: 1,
    numDests: 2,
    sourceNames: ['S1'],
    destNames: ['A', 'B'],
    supplies: [10],
    demands: [4, 6],
    costs: [[2, 3]]
};

test('builds a balanced transport LP', () => {
    const model = createTransportModel(state);
    assert.equal(model.numVars, 2);
    assert.equal(model.constraints.length, 3);
    assert.equal(model.constraints[0].op, '<=');
    assert.equal(model.constraints[0].rhs, 10);
    assert.equal(model.constraints[1].op, '=');
    assert.equal(model.constraints[1].rhs, 4);
    assert.equal(isBalancedTransport(state), true);
});

test('treats floating-point totals within tolerance as balanced', () => {
    assert.equal(isBalancedTransport({ supplies: [0.1, 0.2], demands: [0.3] }), true);
});

test('reports surplus supply as unbalanced without changing demand constraints', () => {
    const surplusState = { ...state, supplies: [11] };
    const model = createTransportModel(surplusState);

    assert.equal(isBalancedTransport(surplusState), false);
    assert.equal(model.constraints[0].op, '<=');
    assert.equal(model.constraints[1].op, '=');
});
