import test from 'node:test';
import assert from 'node:assert/strict';
import { guidedScenarioData } from '../../src/data/guided-scenarios.js';
import { presets } from '../../src/data/presets.js';
import { templates } from '../../src/data/templates.js';
import { transportPresets } from '../../src/data/transport-presets.js';
import { solveFullLPModel } from '../../src/domain/integer-solver.js';
import { createTransportModel } from '../../src/domain/transport-model.js';

test('all LP presets and templates load into solvable models', () => {
    for (const [key, preset] of Object.entries(presets)) {
        const solution = solveFullLPModel(preset.model);
        const expectedStatus = key === 'infeasible' ? 'infeasible' : key === 'unbounded' ? 'unbounded' : 'optimal';
        assert.equal(solution.status, expectedStatus, `preset ${key}`);
    }

    for (const [key, template] of Object.entries(templates)) {
        assert.equal(solveFullLPModel(template.model).status, 'optimal', `template ${key}`);
    }
});

test('both transport examples solve and all five guided model categories are defined', () => {
    for (const [key, preset] of Object.entries(transportPresets)) {
        const model = createTransportModel(preset.state);
        assert.equal(solveFullLPModel(model).status, 'optimal', `transport preset ${key}`);
    }

    const guidedKeys = ['allocation', 'cost', 'transport', 'assignment', 'blending'];
    for (const key of guidedKeys) {
        assert.ok(guidedScenarioData[key], `guided scenario ${key}`);
        assert.ok(guidedScenarioData[key].model, `guided scenario model ${key}`);
    }
});
