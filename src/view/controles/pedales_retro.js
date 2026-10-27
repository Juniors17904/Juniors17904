'use strict';
try {

// ================================================================
// VIEW — PedalesRetro: estilo de pedales "Retro" (PRD 021, D3).
// Botón de arcade con borde grueso.
// ================================================================
class PedalesRetro extends window.EstiloPedales {
    get clave()  { return 'retro'; }
    get nombre() { return 'Retro'; }
}

window.PedalesRetro = PedalesRetro;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pedales_retro.js] ' + e.message);
    console.error('[pedales_retro.js]', e);
}
