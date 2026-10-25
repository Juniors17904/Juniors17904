'use strict';
try {

// ================================================================
// MODEL — PoseCierre: un punto del piso (x, z) con su rumbo (PRD 014).
// El rumbo es el de la ruta: hacia adelante es (sin rumbo, cos rumbo) y
// un rumbo que crece dobla a la derecha.
// ================================================================
class PoseCierre {
    #x; #z; #rumbo;

    constructor(x, z, rumbo) {
        this.#x = x;
        this.#z = z;
        this.#rumbo = rumbo;
    }

    get x()     { return this.#x; }
    get z()     { return this.#z; }
    get rumbo() { return this.#rumbo; }

    distanciaA(otra) { return Math.hypot(otra.x - this.#x, otra.z - this.#z); }
}

window.PoseCierre = PoseCierre;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pose_cierre.js] ' + e.message);
    console.error('[pose_cierre.js]', e);
}
