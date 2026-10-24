'use strict';

import { ObjetoSolido } from './objeto_solido.js';

// ================================================================
// MODEL — ArbolSolido: el tronco de un árbol (PRD 008, D2; PRD 010, D4 y D6).
// Choca solo el tronco: su radio sale de MedidasEscena y crece con el
// tamaño propio del árbol (la escala de la decoración, 1 por defecto).
// La copa queda por encima del carro y no cuenta.
// ================================================================
export class ArbolSolido extends ObjetoSolido {
    #radio;

    constructor(x, z, tamanoPropio = 1) {
        super(x, z);
        this.#radio = new globalThis.MedidasEscena().radioTroncoArbol * tamanoPropio;
    }

    get radio() { return this.#radio; }
    get tipo()  { return 'arbol'; }
}
