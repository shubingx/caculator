import { clipPolygonByHalfPlane } from '../../domain/geometry.js';
import { fmtNum } from '../../ui/formatters.js';
export function draw2DGraph() {
            if (lpState.numVars !== 2) return;
            const canvas = document.getElementById('lp-graph-canvas');
            if (!canvas) return;
            const rect = canvas.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            const W = rect.width;
            const H = rect.height;

            // 清空深色畫布
            ctx.fillStyle = '#080d1a';
            ctx.fillRect(0, 0, W, H);

            // 決定繪圖座標範圍 [0, maxX] x [0, maxY]
            let maxBoundX = 10;
            let maxBoundY = 10;

            lpState.constraints.forEach(c => {
                const a = c.coeffs[0] || 0;
                const b = c.coeffs[1] || 0;
                const rhs = c.rhs;
                if (Math.abs(a) > 1e-5 && rhs / a > 0) maxBoundX = Math.max(maxBoundX, (rhs / a) * 1.25);
                if (Math.abs(b) > 1e-5 && rhs / b > 0) maxBoundY = Math.max(maxBoundY, (rhs / b) * 1.25);
            });

            if (lastSolution && lastSolution.status === 'optimal') {
                maxBoundX = Math.max(maxBoundX, Math.abs(lastSolution.x[0]) * 1.4 + 2);
                maxBoundY = Math.max(maxBoundY, Math.abs(lastSolution.x[1]) * 1.4 + 2);
            }

            // 美化刻度上限
            const niceMax = (v) => {
                const p = Math.pow(10, Math.floor(Math.log10(v)));
                const n = v / p;
                if (n <= 1.5) return 1.5 * p;
                if (n <= 2) return 2 * p;
                if (n <= 3) return 3 * p;
                if (n <= 5) return 5 * p;
                if (n <= 8) return 8 * p;
                return 10 * p;
            };
            const maxX = niceMax(maxBoundX);
            const maxY = niceMax(maxBoundY);

            const padL = 52, padR = 26, padT = 24, padB = 42;
            const plotW = W - padL - padR;
            const plotH = H - padT - padB;

            const toScreenX = (x) => padL + (x / maxX) * plotW;
            const toScreenY = (y) => padT + plotH - (y / maxY) * plotH;
            const toMathX = (px) => ((px - padL) / plotW) * maxX;
            const toMathY = (py) => ((padT + plotH - py) / plotH) * maxY;

            // 綁定滑鼠移動顯示座標
            canvas.onmousemove = (e) => {
                const r = canvas.getBoundingClientRect();
                const mx = toMathX(e.clientX - r.left);
                const my = toMathY(e.clientY - r.top);
                const label = document.getElementById('canvas-hover-coords');
                if (mx >= 0 && mx <= maxX && my >= 0 && my <= maxY) {
                    const zHover = (lpState.objCoeffs[0] || 0) * mx + (lpState.objCoeffs[1] || 0) * my;
                    label.textContent = `游標：(x₁: ${mx.toFixed(2)}, x₂: ${my.toFixed(2)}) | Z = ${zHover.toFixed(2)}`;
                }
            };

            // 1. 繪製背景網格與座標軸刻度
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.fillStyle = '#64748b';
            ctx.font = '11px "JetBrains Mono", monospace';

            const steps = 5;
            for (let i = 0; i <= steps; i++) {
                const vx = (maxX / steps) * i;
                const sx = toScreenX(vx);
                ctx.beginPath();
                ctx.moveTo(sx, padT);
                ctx.lineTo(sx, padT + plotH);
                ctx.stroke();
                ctx.textAlign = 'center';
                ctx.fillText(fmtNum(vx, 1), sx, padT + plotH + 18);

                const vy = (maxY / steps) * i;
                const sy = toScreenY(vy);
                ctx.beginPath();
                ctx.moveTo(padL, sy);
                ctx.lineTo(padL + plotW, sy);
                ctx.stroke();
                ctx.textAlign = 'right';
                ctx.fillText(fmtNum(vy, 1), padL - 8, sy + 4);
            }

            // 軸標籤
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px "Inter", sans-serif';
            ctx.fillText(`x₁ (${lpState.varNames[0] || '變數1'})`, padL + plotW / 2, H - 6);
            ctx.save();
            ctx.translate(14, padT + plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`x₂ (${lpState.varNames[1] || '變數2'})`, 0, 0);
            ctx.restore();

            // 2. 計算並塗色可行解區域 (Feasible Region Polygon)
            let poly = [
                { x: 0, y: 0 },
                { x: maxX * 2, y: 0 },
                { x: maxX * 2, y: maxY * 2 },
                { x: 0, y: maxY * 2 }
            ];

            // 若有等式限制式，給微小帶寬以視覺化，不等式則直接裁剪半平面
            lpState.constraints.forEach(c => {
                const a = c.coeffs[0] || 0;
                const b = c.coeffs[1] || 0;
                const rhs = c.rhs;
                if (c.op === '<=') {
                    poly = clipPolygonByHalfPlane(poly, a, b, rhs);
                } else if (c.op === '>=') {
                    poly = clipPolygonByHalfPlane(poly, -a, -b, -rhs);
                } else if (c.op === '=') {
                    poly = clipPolygonByHalfPlane(poly, a, b, rhs + 0.05);
                    poly = clipPolygonByHalfPlane(poly, -a, -b, -rhs + 0.05);
                }
            });

            // 裁剪畫布邊界
            const drawPoly = clipPolygonByHalfPlane(
                clipPolygonByHalfPlane(poly, 1, 0, maxX),
                0, 1, maxY
            );

            ctx.save();
            ctx.beginPath();
            ctx.rect(padL, padT, plotW, plotH);
            ctx.clip();

            if (drawPoly.length >= 3) {
                const grad = ctx.createLinearGradient(padL, padT + plotH, padL + plotW, padT);
                grad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
                grad.addColorStop(1, 'rgba(99, 102, 241, 0.22)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(toScreenX(drawPoly[0].x), toScreenY(drawPoly[0].y));
                for (let i = 1; i < drawPoly.length; i++) {
                    ctx.lineTo(toScreenX(drawPoly[i].x), toScreenY(drawPoly[i].y));
                }
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
                ctx.lineWidth = 1.8;
                ctx.stroke();
            }

            // 3. 繪製每條限制式邊界直線
            const lineColors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb7185'];
            lpState.constraints.forEach((c, idx) => {
                const a = c.coeffs[0] || 0;
                const b = c.coeffs[1] || 0;
                const rhs = c.rhs;
                const color = lineColors[idx % lineColors.length];

                let pts = [];
                if (Math.abs(b) > 1e-7) {
                    pts.push({ x: 0, y: rhs / b });
                    pts.push({ x: maxX, y: (rhs - a * maxX) / b });
                } else if (Math.abs(a) > 1e-7) {
                    pts.push({ x: rhs / a, y: 0 });
                    pts.push({ x: rhs / a, y: maxY });
                }

                if (pts.length === 2) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(toScreenX(pts[0].x), toScreenY(pts[0].y));
                    ctx.lineTo(toScreenX(pts[1].x), toScreenY(pts[1].y));
                    ctx.stroke();

                    // 標示限制式名稱
                    const midX = Math.max(0.08 * maxX, Math.min(0.82 * maxX, (pts[0].x + pts[1].x) * 0.4));
                    const midY = Math.abs(b) > 1e-7 ? (rhs - a * midX) / b : maxY * 0.5;
                    if (midY >= 0 && midY <= maxY) {
                        ctx.fillStyle = color;
                        ctx.font = '600 11px "Inter", sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText(c.name || `C${idx + 1}`, toScreenX(midX) + 5, toScreenY(midY) - 6);
                    }
                }
            });

            // 4. 繪製等利潤線 / 等成本線 (Iso-profit / Iso-cost Line)
            const showIsoline = document.getElementById('toggle-isoline').checked;
            if (showIsoline && lastSolution && lastSolution.status === 'optimal') {
                const c1 = lpState.objCoeffs[0] || 0;
                const c2 = lpState.objCoeffs[1] || 0;
                const zStar = lastSolution.z;

                let isoPts = [];
                if (Math.abs(c2) > 1e-7) {
                    isoPts.push({ x: 0, y: zStar / c2 });
                    isoPts.push({ x: maxX, y: (zStar - c1 * maxX) / c2 });
                } else if (Math.abs(c1) > 1e-7) {
                    isoPts.push({ x: zStar / c1, y: 0 });
                    isoPts.push({ x: zStar / c1, y: maxY });
                }

                if (isoPts.length === 2) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 2.2;
                    ctx.setLineDash([6, 5]);
                    ctx.beginPath();
                    ctx.moveTo(toScreenX(isoPts[0].x), toScreenY(isoPts[0].y));
                    ctx.lineTo(toScreenX(isoPts[1].x), toScreenY(isoPts[1].y));
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            // 5. 收集所有可行極點 (Corner Points) 並繪製頂點與表格
            let allLines = [
                { a: 1, b: 0, c: 0 }, // x1 = 0
                { a: 0, b: 1, c: 0 }  // x2 = 0
            ];
            lpState.constraints.forEach(c => {
                allLines.push({ a: c.coeffs[0] || 0, b: c.coeffs[1] || 0, c: c.rhs });
            });

            let feasibleVertices = [];
            for (let i = 0; i < allLines.length; i++) {
                for (let j = i + 1; j < allLines.length; j++) {
                    const L1 = allLines[i], L2 = allLines[j];
                    const det = L1.a * L2.b - L2.a * L1.b;
                    if (Math.abs(det) < 1e-9) continue;
                    const x = (L1.c * L2.b - L2.c * L1.b) / det;
                    const y = (L1.a * L2.c - L2.a * L1.c) / det;

                    if (x < -1e-5 || y < -1e-5) continue;

                    // 檢查是否滿足所有限制式
                    let ok = true;
                    for (const con of lpState.constraints) {
                        const val = (con.coeffs[0] || 0) * x + (con.coeffs[1] || 0) * y;
                        if (con.op === '<=' && val > con.rhs + 1e-5) { ok = false; break; }
                        if (con.op === '>=' && val < con.rhs - 1e-5) { ok = false; break; }
                        if (con.op === '=' && Math.abs(val - con.rhs) > 1e-5) { ok = false; break; }
                    }
                    if (!ok) continue;

                    // 去重
                    if (!feasibleVertices.some(v => Math.hypot(v.x - x, v.y - y) < 1e-4)) {
                        const cleanX = Math.abs(x) < 1e-7 ? 0 : x;
                        const cleanY = Math.abs(y) < 1e-7 ? 0 : y;
                        const zVal = (lpState.objCoeffs[0] || 0) * cleanX + (lpState.objCoeffs[1] || 0) * cleanY;
                        feasibleVertices.push({ x: cleanX, y: cleanY, z: zVal });
                    }
                }
            }

            // 繪製端點與更新極點表
            const showVertices = document.getElementById('toggle-vertices').checked;
            const cornerTbody = document.getElementById('corner-points-tbody');
            cornerTbody.innerHTML = '';

            feasibleVertices.forEach((v, idx) => {
                const isOpt = lastSolution && lastSolution.status === 'optimal' &&
                    Math.hypot(v.x - lastSolution.x[0], v.y - lastSolution.x[1]) < 1e-3;

                if (showVertices && !isOpt) {
                    const sx = toScreenX(v.x);
                    const sy = toScreenY(v.y);
                    ctx.fillStyle = '#e2e8f0';
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '11px "JetBrains Mono", monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(`P${idx + 1}(${fmtNum(v.x, 1)}, ${fmtNum(v.y, 1)})`, sx + 7, sy - 5);
                }

                const tr = document.createElement('tr');
                tr.className = isOpt ? 'bg-cyan-500/20 text-cyan-200 font-bold' : 'text-slate-300';
                tr.innerHTML = `
                    <td class="py-2 px-3">${isOpt ? '★ 最佳端點' : `P${idx + 1}`}</td>
                    <td class="py-2 px-3">(${fmtNum(v.x, 2)}, ${fmtNum(v.y, 2)})</td>
                    <td class="py-2 px-3 text-right">${fmtNum(v.z, 2)}</td>
                `;
                cornerTbody.appendChild(tr);
            });

            if (feasibleVertices.length === 0) {
                cornerTbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-slate-500">無可行端點</td></tr>`;
            }

            // 6. 標示最佳解點 (Optimal Solution Point)
            if (lastSolution && lastSolution.status === 'optimal') {
                const ox = lastSolution.x[0];
                const oy = lastSolution.x[1];
                const sx = toScreenX(ox);
                const sy = toScreenY(oy);

                // 外圈光暈
                ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
                ctx.beginPath();
                ctx.arc(sx, sy, 12, 0, Math.PI * 2);
                ctx.fill();

                // 實心紅點
                ctx.fillStyle = '#f43f5e';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // 最佳解標籤
                ctx.fillStyle = '#fda4af';
                ctx.font = 'bold 12px "JetBrains Mono", monospace';
                ctx.textAlign = sx > W - 150 ? 'right' : 'left';
                const offsetX = sx > W - 150 ? -12 : 12;
                ctx.fillText(`Optimal (${fmtNum(ox, 2)}, ${fmtNum(oy, 2)}) Z*=${fmtNum(lastSolution.z, 1)}`, sx + offsetX, sy - 10);
            }

            ctx.restore();
        }

        /*************************************************************************
         * 經典案例快速載入 (Presets)
         *************************************************************************/

if (typeof window !== 'undefined') {
    Object.assign(window, { draw2DGraph });
}
