'use strict';
try {

// ================================================================
// VIEW — RenderizadorTimon  (antes TimonRenderer)
// Orquesta los 4 modelos de timón. Cada modelo es una clase propia.
// ================================================================
class RenderizadorTimon {
    static MODELOS = [
        new TimonClasico(),
        new TimonDeportivo(),
        new TimonF1(),
        new TimonRetro(),
    ];

    static dibujar(ctx, S, indice) {
        const modelo = RenderizadorTimon.MODELOS[indice];
        if (!modelo) return;
        ctx.save();
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';
        modelo.dibujar(ctx, S);
        ctx.restore();
    }

    static nombre(indice) {
        return RenderizadorTimon.MODELOS[indice]?.nombre ?? '';
    }
}

window.RenderizadorTimon = RenderizadorTimon;
// Alias de compatibilidad
window.TimonRenderer = RenderizadorTimon;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[renderizador_timon.js] ' + e.message);
    console.error('[renderizador_timon.js]', e);
}
