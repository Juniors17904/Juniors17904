'use strict';
try {

// ================================================================
// VIEW — TimonClasico
// Timón clásico de 3 radios. Se dibuja a sí mismo.
// ================================================================
class TimonClasico {
    get nombre() { return 'Clásico'; }

    dibujar(ctx, S) {
        const r    = S * 0.40;
        const rimW = S * 0.068;
        const hubR = S * 0.085;
        const spW  = S * 0.048;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = rimW;
        ctx.stroke();

        const spokes = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6];
        ctx.lineWidth   = spW;
        ctx.strokeStyle = '#6b7280';
        spokes.forEach(a => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#4b5563';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-hubR * 0.25, -hubR * 0.3, hubR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fill();
    }
}

window.TimonClasico = TimonClasico;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_clasico.js] ' + e.message);
    console.error('[timon_clasico.js]', e);
}
