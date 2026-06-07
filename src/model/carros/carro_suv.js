'use strict';

import { Carro } from './carro.js';

// ================================================================
// MODEL — CarroSUV: velocidad media, más drag, más turbos
// ================================================================
export class CarroSUV extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.velMaxAdelante  = 0.60;
        this.constAceleracion = 0.005;
        this.constArrastre   = 0.010;
        this.turboMaximo     = 4;
        this.turbosLeft      = 4;
    }
}
