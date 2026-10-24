'use strict';

import { ObjetoSolido } from './objeto_solido.js';

// ================================================================
// MODEL — ArbolSolido: el tronco y la copa baja de un árbol (PRD 008, D2).
// ================================================================
export class ArbolSolido extends ObjetoSolido {
    get radio() { return 0.9; }
    get tipo()  { return 'arbol'; }
}
