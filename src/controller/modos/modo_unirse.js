'use strict';

// ================================================================
// CONTROLLER — ModoUnirse: unirse a una sala con código (PRD 002 D8)
// PRD 005 D7: solo conserva pantalla-juego, para que sin visor 3D lleve a Inicio
// ================================================================

try {

class ModoUnirse extends Modo {
    constructor() {
        super('Únete', ['btn-unirse'], ['pantalla-juego']);
    }
}

window.ModoUnirse = ModoUnirse;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_unirse.js] ' + e.message);
    console.error('[modo_unirse.js]', e);
}
