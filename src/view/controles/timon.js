'use strict';
try {

// ================================================================
// CLASE BASE: Timon — interfaz común para todos los modelos de timón
// ================================================================
class Timon {
    get nombre() { return ''; }
    dibujar(ctx, S) {}
}

window.Timon = Timon;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon.js] ' + e.message);
    console.error('[timon.js]', e);
}
