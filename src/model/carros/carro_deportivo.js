'use strict';

import { Carro } from './carro.js';

// ================================================================
// MODEL — CarroDeportivo: alta velocidad, giro preciso, menos turbo
// ================================================================
export class CarroDeportivo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.maxFwd     = 0.92;
        this.accelConst = 0.007;
        this.steerConst = 0.012;
        this.turboMax   = 2;
        this.turbosLeft = 2;
    }
}
