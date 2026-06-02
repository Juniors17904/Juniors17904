'use strict';
try {

// ================================================================
// CLASE: RenderizadorAuto (antes RenderAuto)
// Dibuja sombra y glow del carro en canvas 2D
// ================================================================
class RenderizadorAuto {
    static dibujar(ctx, W, H, carro) {
        const cx   = W / 2;
        const by   = H * 0.93;
        const carW = W * 0.12;
        const carH = carW * 1.7;

        ctx.save();
        ctx.translate(cx, by - carH / 2);
        ctx.rotate(carro.tilt * 0.15);

        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.beginPath();
        ctx.ellipse(0, carH * 0.52, carW * 0.7, carH * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (carro.turboActivo) {
            ctx.fillStyle = `rgba(251,191,36,${0.5 + Math.sin(Date.now() * 0.015) * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(0, carH * 0.52, carW * 0.4, carH * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

window.RenderizadorAuto = RenderizadorAuto;
// Alias de compatibilidad
window.RenderAuto = RenderizadorAuto;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[renderizador_auto.js] ' + e.message);
    console.error('[renderizador_auto.js]', e);
}
