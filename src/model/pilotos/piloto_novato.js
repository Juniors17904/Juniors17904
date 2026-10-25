'use strict';

import { PilotoPC } from './piloto_pc.js';

// ================================================================
// MODEL — PilotoNovato: rival de la PC (PRD 013, D2). Lento e irregular: pisa el pasto seguido.
// ================================================================
export class PilotoNovato extends PilotoPC {
    get nombre()          { return 'Carlos · Novato'; }
    get tipoAuto()        { return 'pickup'; }
    get color()           { return 0x2ecc71; }

    get factorCurva()     { return 0.9; }
    get factorRecta()     { return 0.96; }
    get margenFreno()     { return 0.6; }
    get distanciaMira()   { return 5; }
    get probAbrirse()     { return 0.07; }
    get probFrenarTarde() { return 0.04; }
    get probPasto()       { return 0.07; }
    get duracionError()   { return 1.1; }
    get ruidoVolante()    { return 0.10; }
    get variacionLinea()  { return 0.9; }
}
