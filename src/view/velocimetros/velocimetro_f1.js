'use strict';
try {

// ================================================================
// CLASE: VelocimetroF1 — segmentos LED estilo Fórmula 1
// ================================================================
class VelocimetroF1 extends Velocimetro {
    get nombre() { return 'F1'; }

    dibujar(ctx, cx, cy, r, fraccion) {
        ctx.save();

        ctx.fillStyle = '#060610';
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1.5; ctx.stroke();

        const SEGS       = 30;
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;
        const segAngle   = totalAngle / SEGS;
        const litCount   = Math.floor(fraccion * SEGS);

        for (let i = 0; i < SEGS; i++) {
            const a     = startAngle + i * segAngle + segAngle * 0.08;
            const color = i >= SEGS * 0.85 ? '#ef4444' : i >= SEGS * 0.70 ? '#f59e0b' : '#00ff88';
            ctx.globalAlpha  = i < litCount ? 1 : 0.12;
            ctx.strokeStyle  = color;
            ctx.shadowColor  = i < litCount ? color : 'transparent';
            ctx.shadowBlur   = i < litCount ? 8 : 0;
            ctx.lineWidth    = Math.max(3, r * 0.1);
            ctx.lineCap      = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, r - 6, a, a + segAngle * 0.82);
            ctx.stroke();
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;

        const kmh = Math.round(fraccion * 220);
        ctx.fillStyle = '#00ff88'; ctx.font = `bold ${Math.round(r * 0.46)}px Orbitron, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(kmh, cx, cy - r * 0.05);
        ctx.fillStyle = '#ffffff66'; ctx.font = `${Math.round(r * 0.19)}px Orbitron, monospace`;
        ctx.fillText('km/h', cx, cy + r * 0.44);
        ctx.restore();
    }
}

window.VelocimetroF1 = VelocimetroF1;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[velocimetro_f1.js] ' + e.message);
    console.error('[velocimetro_f1.js]', e);
}
