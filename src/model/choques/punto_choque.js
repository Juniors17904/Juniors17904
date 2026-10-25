'use strict';

// ================================================================
// MODEL — PuntoChoque: un punto del piso (x, z) donde un objeto sólido
// está más cerca del carro (PRD 011, D10).
// ================================================================
export class PuntoChoque {
    #x; #z;

    constructor(x, z) {
        this.#x = x;
        this.#z = z;
    }

    get x() { return this.#x; }
    get z() { return this.#z; }
}
