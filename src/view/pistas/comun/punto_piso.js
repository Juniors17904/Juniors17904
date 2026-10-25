'use strict';

// ================================================================
// VIEW — PuntoPiso: un punto del centro de la pista y su dirección
// perpendicular hacia la derecha (px, pz), con la que se abren el
// asfalto, los pianos y las líneas a cada lado (PRD 012).
// ================================================================
export class PuntoPiso {
    #x; #z; #px; #pz;

    constructor(x, z, px, pz) {
        this.#x = x; this.#z = z; this.#px = px; this.#pz = pz;
    }

    get x()  { return this.#x; }
    get z()  { return this.#z; }
    get px() { return this.#px; }
    get pz() { return this.#pz; }
}
