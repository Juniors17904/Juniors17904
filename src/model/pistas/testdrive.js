'use strict';
try {

// ================================================================
// MODEL — PistaTestDrive: pista recta sin meta para pruebas
// ================================================================
class PistaTestDrive extends PistaConfig {
    #nivelFijo = {
        nombre: 'Test',
        cielo:  ['#0d1b2a', '#1b3a4b'],
        cesped: ['#1a5c1a', '#174d17'],
        asfalto:['#484848', '#3d3d3d'],
        borde:  '#888',
    };

    get nombre()         { return 'Test Drive'; }
    get totalSegs()      { return 80; }
    get distMeta()       { return Infinity; }
    get nivelFijo()      { return this.#nivelFijo; }
    get tramos()         { return []; }
    get esTestDrive()    { return true; }
    get obstFrecuencia() { return 0; }
    get obstTipos()      { return []; }
    get coloresTrafico() { return []; }
}

window.PISTAS.testdrive = new PistaTestDrive();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/testdrive.js] ' + e.message);
    console.error('[pistas/testdrive.js]', e);
}
