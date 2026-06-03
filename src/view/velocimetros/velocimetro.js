'use strict';
try {

// ================================================================
// CLASE BASE: Velocimetro — interfaz común para todos los modelos
// ================================================================
class Velocimetro {
    get nombre() { return ''; }
    dibujar(ctx, cx, cy, r, fraccion) {}
}

window.Velocimetro = Velocimetro;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[velocimetro.js] ' + e.message);
    console.error('[velocimetro.js]', e);
}
