'use strict';

// ================================================================
// CLASE: PuntoMinimapa — un punto del trazado del circuito ya pasado
// a píxeles del minimapa (#minimap-td3d). Solo se lee (lección 3).
// ================================================================
class PuntoMinimapa {
    #x = 0;
    #y = 0;

    constructor(x, y) {
        this.#x = x;
        this.#y = y;
    }

    get x() { return this.#x; }
    get y() { return this.#y; }
}
