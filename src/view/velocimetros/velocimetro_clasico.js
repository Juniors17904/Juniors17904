'use strict';
try {

// ================================================================
// CLASE: VelocimetroClasico — estilo neon cyan con aguja blanca
// ================================================================
class VelocimetroClasico {
    get nombre() { return 'Clásico'; }

    dibujar(ctx, cx, cy, r, fraccion) {
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#1e1e40'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();

        const velColor = fraccion > 0.8 ? '#ef4444' : fraccion > 0.5 ? '#f59e0b' : '#06b6d4';
        ctx.shadowColor = velColor; ctx.shadowBlur = 12;
        ctx.strokeStyle = velColor; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 0.75 + fraccion * Math.PI * 1.5); ctx.stroke();
        ctx.shadowBlur = 0;

        const angle = Math.PI * 0.75 + fraccion * Math.PI * 1.5;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * (r - 14), cy + Math.sin(angle) * (r - 14)); ctx.stroke();

        ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

        const kmh = Math.round(fraccion * 220);
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(r * 0.26)}px Orbitron, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(kmh + ' km/h', cx, cy + r * 0.55);
        ctx.restore();
    }
}

window.VelocimetroClasico = VelocimetroClasico;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[velocimetro_clasico.js] ' + e.message);
    console.error('[velocimetro_clasico.js]', e);
}
