'use strict';
try {

// ================================================================
// VIEW — RenderizadorTimon  (antes TimonRenderer)
// Orquesta los 6 modelos de timón. Cada modelo es una clase propia.
// Rally y Camión van al final (PRD 021, D5): los 4 de hoy no se mueven.
// ================================================================
class RenderizadorTimon {
    static MODELOS = [
        new TimonClasico(),
        new TimonDeportivo(),
        new TimonF1(),
        new TimonRetro(),
        new TimonRally(),
        new TimonCamion(),
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
