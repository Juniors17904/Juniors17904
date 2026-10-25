'use strict';

// ================================================================
// MODEL — PuntoSalida: un lugar de la grilla de salida (PRD 013, RF-01):
// dónde está el centro del carro (x, z) y hacia dónde mira (angulo).
// Solo lectura.
// ================================================================
export class PuntoSalida {
    #x; #z; #angulo;

    constructor(x, z, angulo) {
        this.#x      = Number(x)      || 0;
        this.#z      = Number(z)      || 0;
        this.#angulo = Number(angulo) || 0;
    }

    get x()      { return this.#x; }
    get z()      { return this.#z; }
    get angulo() { return this.#angulo; }
}
