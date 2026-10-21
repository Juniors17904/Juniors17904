'use strict';

// ================================================================
// CONTROLLER — ModoUnirse: unirse a una sala con código (corre en 2D) (PRD 002 D8)
// ================================================================

try {

class ModoUnirse extends Modo {
    constructor() {
        super('Únete', ['btn-unirse'], ['pantalla-unirse', 'pantalla-espera', 'pantalla-juego', 'pantalla-resultado']);
    }
}

window.ModoUnirse = ModoUnirse;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_unirse.js] ' + e.message);
    console.error('[modo_unirse.js]', e);
}
