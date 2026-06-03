'use strict';

import { Carro } from './carro.js';

// ================================================================
// MODEL — CarroMusculo: máxima velocidad, giro duro, poco turbo
// ================================================================
export class CarroMusculo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.maxFwd     = 1.00;
        this.accelConst = 0.009;
        this.steerConst = 0.007;
        this.turboMax   = 2;
        this.turbosLeft = 2;
    }
}
