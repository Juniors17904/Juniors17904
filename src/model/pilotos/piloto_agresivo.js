'use strict';

import { PilotoPC } from './piloto_pc.js';

// ================================================================
// MODEL — PilotoAgresivo: rival de la PC (PRD 013, D2). Rápido, frena tarde y a veces se sale.
// ================================================================
export class PilotoAgresivo extends PilotoPC {
    get nombre()          { return 'Bruno · Agresivo'; }
    get tipoAuto()        { return 'muscle'; }
    get color()           { return 0xe74c3c; }

    get factorCurva()     { return 1.03; }
    get margenFreno()     { return 1; }
    get probAbrirse()     { return 0.05; }
    get probFrenarTarde() { return 0.06; }
    get probPasto()       { return 0.015; }
    get duracionError()   { return 0.8; }
    get ruidoVolante()    { return 0.05; }
    get variacionLinea()  { return 0.6; }
}
