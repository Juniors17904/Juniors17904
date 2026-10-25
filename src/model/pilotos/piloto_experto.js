'use strict';

import { PilotoPC } from './piloto_pc.js';

// ================================================================
// MODEL — PilotoExperto: rival de la PC (PRD 013, D2). El más rápido, con errores muy raros.
// ================================================================
export class PilotoExperto extends PilotoPC {
    get nombre()          { return 'Diego · Experto'; }
    get tipoAuto()        { return 'formula'; }
    get color()           { return 0xf1c40f; }

    get factorCurva()     { return 1.0; }
    get margenFreno()     { return 0.95; }
    get probAbrirse()     { return 0.01; }
    get probFrenarTarde() { return 0.01; }
    get probPasto()       { return 0.002; }
    get duracionError()   { return 0.6; }
    get ruidoVolante()    { return 0.02; }
    get variacionLinea()  { return 0.3; }
}
