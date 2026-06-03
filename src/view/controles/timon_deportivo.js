'use strict';
try {

// ================================================================
// VIEW — TimonDeportivo
// Timón deportivo con aro negro y radios en morado/gris.
// ================================================================
class TimonDeportivo extends Timon {
    get nombre() { return 'Deportivo'; }

    dibujar(ctx, S) {
        const r    = S * 0.40;
        const rimW = S * 0.076;
        const hubR = S * 0.092;
        const spW  = S * 0.05;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = rimW + S * 0.018;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = rimW;
        ctx.stroke();

        [Math.PI * 0.65, Math.PI * 1.35].forEach(sa => {
            ctx.beginPath();
            ctx.arc(0, 0, r, sa, sa + Math.PI * 0.3);
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = rimW * 1.05;
            ctx.stroke();
        });

        const spokes = [
            { a: -Math.PI / 2,    color: '#a78bfa' },
            { a: Math.PI / 6,     color: '#4b5563' },
            { a: 5 * Math.PI / 6, color: '#4b5563' },
        ];
        ctx.lineWidth = spW;
        spokes.forEach(({ a, color }) => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.strokeStyle = color;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#7c3aed';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = '#c4b5fd';
        ctx.fill();
    }
}

window.TimonDeportivo = TimonDeportivo;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_deportivo.js] ' + e.message);
    console.error('[timon_deportivo.js]', e);
}
