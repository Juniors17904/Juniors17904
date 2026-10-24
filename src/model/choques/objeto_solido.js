'use strict';

// ================================================================
// MODEL — ObjetoSolido: algo junto a la pista que el carro no puede
// atravesar (PRD 008, D2 y D6). Cada tipo define su radio; la posición
// la calcula el modelo a partir de los datos de la pista.
// ================================================================
export class ObjetoSolido {
    #x; #z;

    constructor(x, z) {
        this.#x = x;
        this.#z = z;
    }

    get x()     { return this.#x; }
    get z()     { return this.#z; }
    get radio() { return 0.5; }
    get tipo()  { return ''; }
}
