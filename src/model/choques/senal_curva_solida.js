'use strict';

import { ObjetoSolido } from './objeto_solido.js';

// ================================================================
// MODEL — SenalCurvaSolida: el palo de una señal de curva (PRD 008, D2;
// PRD 010, D4 y D6). Choca solo el palo (radio de MedidasEscena); el
// cartel queda por encima del carro y no cuenta.
// ================================================================
export class SenalCurvaSolida extends ObjetoSolido {
    #radio;

    constructor(x, z) {
        super(x, z);
        this.#radio = new globalThis.MedidasEscena().radioPaloSenal;
    }

    get radio() { return this.#radio; }
    get tipo()  { return 'senal_curva'; }
}
