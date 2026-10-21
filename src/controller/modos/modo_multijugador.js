'use strict';

// ================================================================
// CONTROLLER — ModoMultijugador: crear sala multijugador (corre en 2D) (PRD 002 D8)
// ================================================================

try {

class ModoMultijugador extends Modo {
    constructor() {
        super('Multijugador', ['btn-crear'], ['pantalla-crear', 'pantalla-espera', 'pantalla-juego', 'pantalla-resultado']);
    }
}

window.ModoMultijugador = ModoMultijugador;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_multijugador.js] ' + e.message);
    console.error('[modo_multijugador.js]', e);
}
