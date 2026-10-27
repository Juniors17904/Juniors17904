'use strict';
try {

// ================================================================
// VIEW — PedalesF1: estilo de pedales "F1" (PRD 021, D3).
// Con forma de leva, como las de un volante de Fórmula 1.
// ================================================================
class PedalesF1 extends window.EstiloPedales {
    get clave()  { return 'f1'; }
    get nombre() { return 'F1'; }
}

window.PedalesF1 = PedalesF1;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pedales_f1.js] ' + e.message);
    console.error('[pedales_f1.js]', e);
}
