'use strict';
try {

// ================================================================
// VIEW — TimonRetro  (antes TimonVintage)
// Timón retro de madera con aro marrón y hub dorado.
// ================================================================
class TimonRetro extends Timon {
    get nombre() { return 'Retro'; }

    dibujar(ctx, S) {
        const r    = S * 0.42;
        const rimW = S * 0.038;
        const hubR = S * 0.07;
        const spW  = S * 0.032;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = rimW + S * 0.01;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = rimW;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251,191,36,0.25)';
        ctx.lineWidth = rimW * 0.35;
        ctx.stroke();

        [Math.PI / 4, -Math.PI / 4].forEach(a => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a + Math.PI) * (r - rimW * 0.5), Math.sin(a + Math.PI) * (r - rimW * 0.5));
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = spW;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#92400e';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#78350f';
        ctx.fill();
    }
}

window.TimonRetro = TimonRetro;
// Alias de compatibilidad
window.TimonVintage = TimonRetro;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_retro.js] ' + e.message);
    console.error('[timon_retro.js]', e);
}
