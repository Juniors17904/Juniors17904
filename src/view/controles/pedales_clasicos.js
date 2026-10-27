'use strict';
try {

// ================================================================
// VIEW — PedalesClasicos: estilo de pedales "Clásico" (PRD 021, D3).
// Los botones redondos de siempre; es el elegido de fábrica.
// ================================================================
class PedalesClasicos extends window.EstiloPedales {
    get clave()  { return 'clasicos'; }
    get nombre() { return 'Clásico'; }
}

window.PedalesClasicos = PedalesClasicos;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pedales_clasicos.js] ' + e.message);
    console.error('[pedales_clasicos.js]', e);
}
