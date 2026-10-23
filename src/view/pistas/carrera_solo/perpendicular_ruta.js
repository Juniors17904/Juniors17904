'use strict';

// ================================================================
// VIEW — PerpendicularRuta: dirección perpendicular (en el plano XZ) a la
// ruta en un punto. La usa ConstructorCircuitoCarreraSolo para abrir la
// cinta de asfalto, los pianos y las líneas hacia cada lado del centro.
// ================================================================
export class PerpendicularRuta {
    #px;
    #pz;

    constructor(px, pz) {
        this.#px = px;
        this.#pz = pz;
    }

    get px() { return this.#px; }
    get pz() { return this.#pz; }
}
