import { createLpModel } from './lp-model.js';

export function createTransportModel(state) {
    const sourceCount = state.numSources;
    const destinationCount = state.numDests;
    const numVars = sourceCount * destinationCount;
    const varNames = [];
    const objCoeffs = [];

    for (let source = 0; source < sourceCount; source += 1) {
        for (let destination = 0; destination < destinationCount; destination += 1) {
            varNames.push(`${state.sourceNames[source]}→${state.destNames[destination]}`);
            objCoeffs.push(Number(state.costs[source]?.[destination]) || 0);
        }
    }

    const constraints = [];
    for (let source = 0; source < sourceCount; source += 1) {
        const coeffs = Array(numVars).fill(0);
        for (let destination = 0; destination < destinationCount; destination += 1) {
            coeffs[source * destinationCount + destination] = 1;
        }
        constraints.push({ name: `供給限制 ${state.sourceNames[source]}`, coeffs, op: '<=', rhs: Number(state.supplies[source]) || 0 });
    }

    for (let destination = 0; destination < destinationCount; destination += 1) {
        const coeffs = Array(numVars).fill(0);
        for (let source = 0; source < sourceCount; source += 1) {
            coeffs[source * destinationCount + destination] = 1;
        }
        constraints.push({ name: `需求限制 市場${state.destNames[destination]}`, coeffs, op: '=', rhs: Number(state.demands[destination]) || 0 });
    }

    return createLpModel({ type: 'min', unit: '元 (總運輸成本)', numVars, varNames, varTypes: Array(numVars).fill('cont'), objCoeffs, constraints });
}

export function isBalancedTransport(state) {
    const supply = state.supplies.reduce((total, value) => total + Number(value || 0), 0);
    const demand = state.demands.reduce((total, value) => total + Number(value || 0), 0);
    return Math.abs(supply - demand) < 1e-9;
}
