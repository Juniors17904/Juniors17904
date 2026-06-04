'use strict';
try {

// ================================================================
// CLASE BASE: PistaConfig — interfaz común para toda configuración de pista
// ================================================================
class PistaConfig {
    get nombre()          { return ''; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get nivelFijo()       { return null; }
    get tramos()          { return []; }
    get esTestDrive()     { return false; }
    get obstFrecuencia()  { return 0; }
    get obstTipos()       { return []; }
    get coloresTrafico()  { return []; }
}

// ================================================================
// CLASE: PistaTestDriveLibre — wrapper que convierte cualquier pista
// en modo libre (sin meta, sin fin)
// ================================================================
class PistaTestDriveLibre extends PistaConfig {
    #base;
    constructor(base) {
        super();
        this.#base = base;
    }
    get nombre()          { return this.#base.nombre; }
    get totalSegs()       { return this.#base.totalSegs; }
    get nivelFijo()       { return this.#base.nivelFijo; }
    get tramos()          { return this.#base.tramos; }
    get obstFrecuencia()  { return this.#base.obstFrecuencia; }
    get obstTipos()       { return this.#base.obstTipos; }
    get coloresTrafico()  { return this.#base.coloresTrafico; }
    get distMeta()        { return Infinity; }
    get esTestDrive()     { return true; }
}

window.PistaConfig          = PistaConfig;
window.PistaTestDriveLibre  = PistaTestDriveLibre;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pista_config.js] ' + e.message);
    console.error('[pista_config.js]', e);
}
