'use strict';

import { ObjetoSolido } from './objeto_solido.js';

// ================================================================
// MODEL — PosteSolido: un poste de alumbrado (PRD 008, D2).
// ================================================================
export class PosteSolido extends ObjetoSolido {
    get radio() { return 0.3; }
    get tipo()  { return 'poste'; }
}
