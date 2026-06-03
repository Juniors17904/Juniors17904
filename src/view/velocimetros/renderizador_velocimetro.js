'use strict';
try {

// ================================================================
// CLASE: RenderizadorVelocimetro — delega a la clase del modelo elegido
// ================================================================
class RenderizadorVelocimetro {
    static MODELOS = [
        new VelocimetroClasico(),
        new VelocimetroDeportivo(),
        new VelocimetroF1(),
        new VelocimetroRetro(),
    ];

    static dibujar(ctx, cx, cy, r, fraccion, indice = 0) {
        const modelo = RenderizadorVelocimetro.MODELOS[indice] ?? RenderizadorVelocimetro.MODELOS[0];
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        modelo.dibujar(ctx, cx, cy, r, fraccion);
        ctx.restore();
    }

    static nombre(indice) {
        return RenderizadorVelocimetro.MODELOS[indice]?.nombre ?? '';
    }
}

window.RenderizadorVelocimetro = RenderizadorVelocimetro;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[renderizador_velocimetro.js] ' + e.message);
    console.error('[renderizador_velocimetro.js]', e);
}
