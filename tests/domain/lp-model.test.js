import test from 'node:test';
import assert from 'node:assert/strict';
import { createLpModel, validateLpModel } from '../../src/domain/lp-model.js';

test('creates and validates an LP model', () => {
    const model = createLpModel({
        type: 'max',
        numVars: 2,
        varNames: ['x1', 'x2'],
        varTypes: ['cont', 'cont'],
        objCoeffs: [2, 3],
        constraints: [{ coeffs: [1, 1], op: '<=', rhs: 10 }]
    });
    assert.equal(validateLpModel(model).valid, true);
});
