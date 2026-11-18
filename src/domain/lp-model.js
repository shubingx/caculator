export const VARIABLE_TYPES = Object.freeze(['cont', 'free', 'int', 'bin']);
export const OPERATORS = Object.freeze(['<=', '>=', '=']);

export function createLpModel(input = {}) {
    const model = {
        type: input.type === 'min' ? 'min' : 'max',
        unit: input.unit || '',
        numVars: Number(input.numVars) || 0,
        varNames: [...(input.varNames || [])],
        varTypes: [...(input.varTypes || [])],
        objCoeffs: [...(input.objCoeffs || [])],
        constraints: (input.constraints || []).map(constraint => ({
            name: constraint.name || '',
            coeffs: [...(constraint.coeffs || [])],
            op: OPERATORS.includes(constraint.op) ? constraint.op : '<=',
            rhs: Number(constraint.rhs) || 0
        }))
    };

    return model;
}

export function validateLpModel(model) {
    const errors = [];
    if (!model || !Number.isInteger(model.numVars) || model.numVars < 1) {
        errors.push('numVars must be a positive integer');
    }
    if (model && model.varNames.length !== model.numVars) {
        errors.push('varNames length must match numVars');
    }
    if (model && model.objCoeffs.length !== model.numVars) {
        errors.push('objCoeffs length must match numVars');
    }
    if (model && model.varTypes.some(type => !VARIABLE_TYPES.includes(type))) {
        errors.push('varTypes contains an unsupported variable type');
    }
    if (model && model.constraints.some(({ coeffs, op }) => coeffs.length !== model.numVars || !OPERATORS.includes(op))) {
        errors.push('constraints contain invalid coefficients or operator');
    }
    return { valid: errors.length === 0, errors };
}

export function cloneLpModel(model) {
    return createLpModel(JSON.parse(JSON.stringify(model)));
}
