'use strict';

import { ObjetoSolido } from './objeto_solido.js';

// ================================================================
// MODEL — PosteSolido: un poste de alumbrado (PRD 008, D2; PRD 010, D4 y D6).
// Su radio de choque es el del poste, de MedidasEscena.
// ================================================================
export class PosteSolido extends ObjetoSolido {
    #radio;

    constructor(x, z) {
        super(x, z);
        this.#radio = new globalThis.MedidasEscena().radioPoste;
    }

    get radio() { return this.#radio; }
    get tipo()  { return 'poste'; }
}
