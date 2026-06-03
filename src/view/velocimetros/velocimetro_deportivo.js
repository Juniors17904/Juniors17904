'use strict';
try {

// ================================================================
// CLASE: VelocimetroDeportivo — agresivo rojo/naranja con marcas
// ================================================================
class VelocimetroDeportivo {
    get nombre() { return 'Deportivo'; }

    dibujar(ctx, cx, cy, r, fraccion) {
        ctx.save();

        ctx.fillStyle = '#0f0000';
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();

        ctx.strokeStyle = '#2d0000'; ctx.lineWidth = 10; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();

        const velColor = fraccion > 0.8 ? '#ef4444' : fraccion > 0.5 ? '#f97316' : '#dc2626';
        ctx.shadowColor = velColor; ctx.shadowBlur = 14;
        ctx.strokeStyle = velColor; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 0.75 + fraccion * Math.PI * 1.5); ctx.stroke();
        ctx.shadowBlur = 0;

        for (let i = 0; i <= 6; i++) {
            const a = Math.PI * 0.75 + (i / 6) * Math.PI * 1.5;
            ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18));
            ctx.lineTo(cx + Math.cos(a) * (r - 25), cy + Math.sin(a) * (r - 25));
            ctx.stroke();
        }

        const angle = Math.PI * 0.75 + fraccion * Math.PI * 1.5;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(angle) * 8, cy - Math.sin(angle) * 8);
        ctx.lineTo(cx + Math.cos(angle) * (r - 16), cy + Math.sin(angle) * (r - 16));
        ctx.stroke();

        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();

        const kmh = Math.round(fraccion * 220);
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(r * 0.28)}px Orbitron, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(kmh, cx, cy + r * 0.42);
        ctx.fillStyle = '#ef4444'; ctx.font = `${Math.round(r * 0.15)}px Orbitron, monospace`;
        ctx.fillText('km/h', cx, cy + r * 0.63);
        ctx.restore();
    }
}

window.VelocimetroDeportivo = VelocimetroDeportivo;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[velocimetro_deportivo.js] ' + e.message);
    console.error('[velocimetro_deportivo.js]', e);
}
