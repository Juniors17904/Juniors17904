'use strict';

import { Carro } from './carro.js';

// ================================================================
// MODEL — CarroMusculo: máxima velocidad, giro duro, poco turbo
// ================================================================
export class CarroMusculo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.velMaxAdelante  = 1.00;
        this.constAceleracion = 0.009;
        this.constDireccion  = 0.007;
        this.turboMaximo     = 2;
        this.turbosLeft      = 2;
    }
}
