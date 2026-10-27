'use strict';
try {

// ================================================================
// VIEW — PedalesDeportivos: estilo de pedales "Deportivo" (PRD 021, D3).
// Pedal metálico: el acelerador alto y angosto, el freno ancho.
// ================================================================
class PedalesDeportivos extends window.EstiloPedales {
    get clave()  { return 'deportivos'; }
    get nombre() { return 'Deportivo'; }
}

window.PedalesDeportivos = PedalesDeportivos;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pedales_deportivos.js] ' + e.message);
    console.error('[pedales_deportivos.js]', e);
}
