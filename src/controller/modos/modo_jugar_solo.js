'use strict';

// ================================================================
// CONTROLLER — ModoJugarSolo: carrera 3D de un jugador (PRD 002 D8), que
// se prepara antes en "Preparar carrera" (PRD 018)
// ================================================================

try {

class ModoJugarSolo extends Modo {
    constructor() {
        super('Jugar Solo', ['btn-solo'], ['pantalla-preparar-carrera', 'pantalla-carrera-solo']);
    }
}

window.ModoJugarSolo = ModoJugarSolo;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_jugar_solo.js] ' + e.message);
    console.error('[modo_jugar_solo.js]', e);
}
