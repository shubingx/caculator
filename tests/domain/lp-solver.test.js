import test from 'node:test';
import assert from 'node:assert/strict';
import { createLpModel } from '../../src/domain/lp-model.js';
import { solveFullLPModel } from '../../src/domain/integer-solver.js';

function model(type, objCoeffs, constraints, varTypes = ['cont', 'cont']) {
    return createLpModel({
        type,
        numVars: objCoeffs.length,
        varNames: objCoeffs.map((_, index) => `x${index + 1}`),
        varTypes,
        objCoeffs,
        constraints
    });
}

test('solves the lecture example and returns shadow prices', () => {
    const solution = solveFullLPModel(model('max', [20, 15], [
        { name: 'raw material', coeffs: [2, 1], op: '<=', rhs: 20 },
        { name: 'labor', coeffs: [1, 3], op: '<=', rhs: 35 }
    ]));

    assert.equal(solution.status, 'optimal');
    assert.deepEqual(solution.x, [5, 10]);
    assert.equal(solution.z, 250);
    assert.deepEqual(solution.constraints.map(constraint => constraint.shadowPrice), [9, 2]);
});

test('reports infeasible and unbounded models', () => {
    const infeasible = solveFullLPModel(model('max', [10, 15], [
        { coeffs: [1, 1], op: '<=', rhs: 10 },
        { coeffs: [1, 1], op: '>=', rhs: 20 }
    ]));
    const unbounded = solveFullLPModel(model('max', [10, 20], [
        { coeffs: [1, 1], op: '>=', rhs: 5 },
        { coeffs: [-1, 1], op: '<=', rhs: 10 }
    ]));

    assert.equal(infeasible.status, 'infeasible');
    assert.equal(unbounded.status, 'unbounded');
});

test('solves an integer model and marks node-limit results as truncated', () => {
    const integerSolution = solveFullLPModel(model('max', [8, 5], [
        { coeffs: [1, 1], op: '<=', rhs: 6 },
        { coeffs: [9, 5], op: '<=', rhs: 45 }
    ], ['int', 'int']));
    const limitedSolution = solveFullLPModel(model('max', [1], [
        { coeffs: [1], op: '<=', rhs: 2.5 }
    ], ['int']), 1);

    assert.equal(integerSolution.status, 'optimal');
    assert.equal(integerSolution.z, 40);
    assert.ok(integerSolution.x.every(Number.isInteger));
    assert.equal(limitedSolution.status, 'limit');
    assert.equal(limitedSolution.truncated, true);
});
