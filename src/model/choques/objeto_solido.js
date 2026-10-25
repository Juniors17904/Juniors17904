'use strict';

import { PuntoChoque } from './punto_choque.js';

// ================================================================
// MODEL — ObjetoSolido: algo junto a la pista que el carro no puede
// atravesar (PRD 008, D2 y D6). Cada tipo define su radio, que sale de
// MedidasEscena (PRD 010, D6); la posición la calcula el modelo a partir
// de los datos de la pista.
// Cada objeto sabe su propia forma de choque (PRD 011, D10): un centro
// (puntoCercano) rodeado por su radio. Los redondos tienen un solo
// centro; un tablero lo busca a lo largo de su ancho.
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
    // Lo más lejos de (x, z) que el objeto puede tocar algo
    get alcance() { return this.radio; }

    // El centro de la forma del objeto más cercano al rectángulo del carro
    puntoCercano(rectangulo) {
        return new PuntoChoque(this.#x, this.#z);
    }
}
