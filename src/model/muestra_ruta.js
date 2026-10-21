'use strict';

// ================================================================
// MODEL — MuestraRuta: un punto de la ruta tomado por longitud de arco
// (posición x/z y ángulo de avance). Solo lectura. Sin Three.js ni DOM.
// ================================================================

try {

class MuestraRuta {
    #x;
    #z;
    #angulo;

    constructor(x, z, angulo) {
        this.#x      = Number(x)      || 0;
        this.#z      = Number(z)      || 0;
        this.#angulo = Number(angulo) || 0;
    }

    get x()      { return this.#x; }
    get z()      { return this.#z; }
    get angulo() { return this.#angulo; }
}

window.MuestraRuta = MuestraRuta;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('muestra_ruta.js: ' + e.message);
}
