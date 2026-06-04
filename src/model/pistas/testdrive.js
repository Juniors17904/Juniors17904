'use strict';
try {

// ================================================================
// MODEL — PistaTestDrive: pista recta sin meta para pruebas
// ================================================================
class PistaTestDrive extends PistaConfig {
    get nombre()         { return 'Test Drive'; }
    get totalSegs()      { return 80; }
    get distMeta()       { return Infinity; }
    get tramos()         { return []; }
    get esTestDrive()    { return true; }
    get obstFrecuencia() { return 0; }
    get obstTipos()      { return []; }
    get coloresTrafico() { return []; }

    get cielo()   { return ['#0d1b2a', '#1b3a4b']; }
    get cesped()  { return ['#1a5c1a', '#174d17']; }
    get asfalto() { return ['#484848', '#3d3d3d']; }
    get borde()   { return '#888'; }
}

window.PISTAS.testdrive = new PistaTestDrive();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/testdrive.js] ' + e.message);
    console.error('[pistas/testdrive.js]', e);
}
