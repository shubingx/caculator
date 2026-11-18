export function clipPolygonByHalfPlane(polygon, a, b, c) {
    if (!polygon.length) return [];
    const inside = point => a * point.x + b * point.y <= c + 1e-9;
    const intersection = (start, end) => {
        const startValue = a * start.x + b * start.y - c;
        const endValue = a * end.x + b * end.y - c;
        const ratio = startValue / (startValue - endValue);
        return {
            x: start.x + ratio * (end.x - start.x),
            y: start.y + ratio * (end.y - start.y)
        };
    };

    const result = [];
    for (let index = 0; index < polygon.length; index += 1) {
        const current = polygon[index];
        const previous = polygon[(index + polygon.length - 1) % polygon.length];
        const currentInside = inside(current);
        const previousInside = inside(previous);
        if (currentInside !== previousInside) result.push(intersection(previous, current));
        if (currentInside) result.push(current);
    }
    return result;
}
