'use strict';

import { ObjetoSolido } from './objeto_solido.js';

// ================================================================
// MODEL — SenalCurvaSolida: el poste de una señal de curva (PRD 008, D2).
// ================================================================
export class SenalCurvaSolida extends ObjetoSolido {
    get radio() { return 0.4; }
    get tipo()  { return 'senal_curva'; }
}
