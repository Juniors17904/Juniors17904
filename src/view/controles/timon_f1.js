'use strict';
try {

// ================================================================
// VIEW — TimonF1
// Timón estilo Fórmula 1 con barra inferior recta y azul cian.
// ================================================================
class TimonF1 {
    get nombre() { return 'F1'; }

    dibujar(ctx, S) {
        const r     = S * 0.38;
        const rimW  = S * 0.058;
        const hubR  = S * 0.075;
        const spW   = S * 0.044;
        const flatY = r * 0.58;
        const a0    = Math.asin(flatY / r);
        const xFlat = Math.cos(a0) * r;

        ctx.beginPath();
        ctx.arc(0, 0, r, a0, Math.PI - a0, true);
        ctx.strokeStyle = '#0e7490';
        ctx.lineWidth = rimW;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xFlat, flatY);
        ctx.lineTo(-xFlat, flatY);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = rimW * 0.75;
        ctx.stroke();

        const spokes = [
            { a: -Math.PI / 2, color: '#06b6d4' },
            { a: Math.PI,      color: '#0891b2' },
            { a: 0,            color: '#0891b2' },
        ];
        ctx.lineWidth = spW;
        spokes.forEach(({ a, color }) => {
            const ex = Math.cos(a) * (r - rimW);
            const ey = Math.sin(a) * (r - rimW);
            if (ey >= flatY) return;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = color;
            ctx.stroke();
        });

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-hubR * 1.3, -hubR * 0.55, hubR * 2.6, hubR * 1.1, hubR * 0.3);
        } else {
            ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        }
        ctx.fillStyle = '#06b6d4';
        ctx.fill();

        const bR = hubR * 0.28;
        [[-hubR * 0.65, 0], [0, 0], [hubR * 0.65, 0]].forEach(([bx, by]) => {
            ctx.beginPath();
            ctx.arc(bx, by, bR, 0, Math.PI * 2);
            ctx.fillStyle = '#0c4a6e';
            ctx.fill();
        });
    }
}

window.TimonF1 = TimonF1;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_f1.js] ' + e.message);
    console.error('[timon_f1.js]', e);
}
