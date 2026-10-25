'use strict';
try {

// ================================================================
// VIEW — DisenoVertical: la carrera con el celular derecho (PRD 001, D10;
// PRD 015, D4). Una columna centrada de hasta 480 px con el HUD arriba y
// los controles abajo.
// ================================================================
class DisenoVertical extends window.DisenoCarrera {
    static #ANCHO_MAXIMO = 480;

    get nombre() { return 'vertical'; }

    anchoArea(anchoVentana) { return Math.min(anchoVentana, DisenoVertical.#ANCHO_MAXIMO); }
}

window.DisenoVertical = DisenoVertical;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[diseno_vertical.js] ' + e.message);
    console.error('[diseno_vertical.js]', e);
}
