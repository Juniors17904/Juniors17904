'use strict';
try {

// ================================================================
// VIEW — DisenoVertical: la carrera con el celular derecho (PRD 001, D10;
// PRD 015, D4). Una columna centrada de hasta 480 px con el HUD arriba y
// los controles abajo, y una cámara de seguimiento cercana con un ángulo
// de visión amplio (78°) para ver la pista en la pantalla angosta.
// ACEL y FRENO van apilados, de 72 px, y el giro máximo pide un arrastre
// fijo de 85 px (PRD 016, D4 y D5): en una pantalla angosta un cuarto del
// ancho llevaría el dedo hasta el borde.
// ================================================================
class DisenoVertical extends window.DisenoCarrera {
    static #ANCHO_MAXIMO = 480;
    static #FOV_CAMARA   = 78;
    static #LADO_PEDAL   = 72;
    static #RECORRIDO_GIRO = 85;

    get nombre()         { return 'vertical'; }
    get camaraVertical() { return true; }
    get fovCamara()      { return DisenoVertical.#FOV_CAMARA; }
    get ladoPedal()       { return DisenoVertical.#LADO_PEDAL; }
    get pedalesApilados() { return true; }

    recorridoGiro() { return DisenoVertical.#RECORRIDO_GIRO; }

    anchoArea(anchoVentana) { return Math.min(anchoVentana, DisenoVertical.#ANCHO_MAXIMO); }
}

window.DisenoVertical = DisenoVertical;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[diseno_vertical.js] ' + e.message);
    console.error('[diseno_vertical.js]', e);
}
