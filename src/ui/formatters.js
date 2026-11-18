const SUBSCRIPT_DIGITS = Object.freeze({
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
});

export function fmtNum(value, decimals = 4) {
    if (value === null || value === undefined || Number.isNaN(value)) return '0';
    if (Math.abs(value) < 1e-9) return '0';
    const factor = 10 ** decimals;
    return (Math.round(value * factor) / factor).toString();
}

export function subDigit(value) {
    return String(value).split('').map(character => SUBSCRIPT_DIGITS[character] || character).join('');
}

export function formatLinearExpression(coeffs, count) {
    const terms = [];
    for (let index = 0; index < count; index += 1) {
        const coefficient = coeffs[index] || 0;
        const subscript = subDigit(index + 1);
        if (Math.abs(coefficient) < 1e-9 && terms.length > 0) continue;
        const absolute = Math.abs(coefficient);
        const sign = coefficient < 0 ? '-' : (terms.length === 0 ? '' : '+');
        const coefficientText = (absolute === 1 && coefficient !== 0) ? '' : fmtNum(absolute);
        if (coefficient === 0 && terms.length === 0 && index < count - 1) continue;
        terms.push(`${sign} ${coefficientText}x${subscript}`.trim());
    }
    return terms.length > 0 ? terms.join(' ') : '0';
}

window.fmtNum = fmtNum;
window.subDigit = subDigit;
window.formatLinearExpression = formatLinearExpression;
