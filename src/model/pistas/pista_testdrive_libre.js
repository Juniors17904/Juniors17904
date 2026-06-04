'use strict';
try {

// ================================================================
// MODEL — PistaTestDriveLibre: wrapper que convierte cualquier pista
//         en modo libre (sin meta, sin fin de carrera)
// ================================================================
class PistaTestDriveLibre extends PistaConfig {
    #base;
    constructor(base) {
        super();
        this.#base = base;
    }
    get nombre()         { return this.#base.nombre; }
    get totalSegs()      { return this.#base.totalSegs; }
    get tramos()         { return this.#base.tramos; }
    get obstFrecuencia() { return this.#base.obstFrecuencia; }
    get obstTipos()      { return this.#base.obstTipos; }
    get coloresTrafico() { return this.#base.coloresTrafico; }
    get distMeta()       { return Infinity; }
    get esTestDrive()    { return true; }

    get cielo()   { return this.#base.cielo; }
    get cesped()  { return this.#base.cesped; }
    get asfalto() { return this.#base.asfalto; }
    get borde()   { return this.#base.borde; }
}

window.PistaTestDriveLibre = PistaTestDriveLibre;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_testdrive_libre.js] ' + e.message);
    console.error('[pistas/pista_testdrive_libre.js]', e);
}
