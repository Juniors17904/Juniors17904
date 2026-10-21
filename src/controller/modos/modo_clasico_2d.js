'use strict';

// ================================================================
// CONTROLLER — ModoClasico2D: carrera clásica antigua en 2D (PRD 002 D8)
// ================================================================

try {

class ModoClasico2D extends Modo {
    constructor() {
        super('Clásico 2D', ['btn-clasico-2d'], ['pantalla-juego']);
    }
}

window.ModoClasico2D = ModoClasico2D;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_clasico_2d.js] ' + e.message);
    console.error('[modo_clasico_2d.js]', e);
}
