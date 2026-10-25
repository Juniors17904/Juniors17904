'use strict';

import { PilotoPC } from './piloto_pc.js';

// ================================================================
// MODEL — PilotoPrudente: rival de la PC (PRD 013, D2). Frena antes de las curvas y casi no se equivoca.
// ================================================================
export class PilotoPrudente extends PilotoPC {
    get nombre()          { return 'Ana · Prudente'; }
    get tipoAuto()        { return 'suv'; }
    get color()           { return 0x2e86de; }

    get factorCurva()     { return 0.95; }
    get margenFreno()     { return 0.55; }
    get probAbrirse()     { return 0.02; }
    get probFrenarTarde() { return 0.005; }
    get probPasto()       { return 0.003; }
    get duracionError()   { return 0.8; }
    get ruidoVolante()    { return 0.03; }
    get variacionLinea()  { return 0.4; }
}
