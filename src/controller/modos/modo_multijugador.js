'use strict';

// ================================================================
// CONTROLLER — ModoMultijugador: crear sala multijugador (PRD 002 D8)
// PRD 005 D7: solo conserva pantalla-juego, para que sin visor 3D lleve a Inicio
// ================================================================

try {

class ModoMultijugador extends Modo {
    constructor() {
        super('Multijugador', ['btn-crear'], ['pantalla-juego']);
    }
}

window.ModoMultijugador = ModoMultijugador;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_multijugador.js] ' + e.message);
    console.error('[modo_multijugador.js]', e);
}
