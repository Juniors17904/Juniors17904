'use strict';
try {

// ================================================================
// CLASE: VelocimetroRetro — ámbar/dorado con marcas de escala
// ================================================================
class VelocimetroRetro extends Velocimetro {
    get nombre() { return 'Retro'; }

    dibujar(ctx, cx, cy, r, fraccion) {
        ctx.save();

        ctx.fillStyle = '#120a00';
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.stroke();

        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        // Marcas menores
        for (let i = 0; i <= 22; i++) {
            const a = startAngle + (i / 22) * totalAngle;
            ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (r - 8),  cy + Math.sin(a) * (r - 8));
            ctx.lineTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14));
            ctx.stroke();
        }

        // Marcas mayores con número
        const etiquetas = [[0, '0'], [55, '60'], [110, '120'], [165, '180'], [220, '220']];
        for (const [vel, lbl] of etiquetas) {
            const a = startAngle + (vel / 220) * totalAngle;
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (r - 8),  cy + Math.sin(a) * (r - 8));
            ctx.lineTo(cx + Math.cos(a) * (r - 17), cy + Math.sin(a) * (r - 17));
            ctx.stroke();
            ctx.fillStyle = '#fbbf24'; ctx.font = `${Math.round(r * 0.15)}px serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(lbl, cx + Math.cos(a) * (r - 25), cy + Math.sin(a) * (r - 25));
        }

        // Arco de velocidad ámbar
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.shadowColor = '#d97706'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r - 30, startAngle, startAngle + fraccion * totalAngle); ctx.stroke();
        ctx.shadowBlur = 0;

        // Aguja
        const angle = startAngle + fraccion * totalAngle;
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * (r - 10), cy + Math.sin(angle) * (r - 10)); ctx.stroke();

        ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();

        const kmh = Math.round(fraccion * 220);
        ctx.fillStyle = '#fbbf24'; ctx.font = `bold ${Math.round(r * 0.22)}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(kmh + ' km/h', cx, cy + r * 0.56);
        ctx.restore();
    }
}

window.VelocimetroRetro = VelocimetroRetro;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[velocimetro_retro.js] ' + e.message);
    console.error('[velocimetro_retro.js]', e);
}
