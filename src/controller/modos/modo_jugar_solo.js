'use strict';

// ================================================================
// CONTROLLER — ModoJugarSolo: carrera 3D vertical contra el reloj (PRD 002 D8)
// ================================================================

try {

class ModoJugarSolo extends Modo {
    constructor() {
        super('Jugar Solo', ['btn-solo'], ['pantalla-carrera-solo']);
    }
}

window.ModoJugarSolo = ModoJugarSolo;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_jugar_solo.js] ' + e.message);
    console.error('[modo_jugar_solo.js]', e);
}
