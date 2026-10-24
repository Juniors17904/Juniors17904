'use strict';

import { Carro }            from './carro.js';
import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — CarroPickup: física del modelo "pickup" del garaje (PRD 007)
//   el más pesado: lento para acelerar y frenar.
// ================================================================
export class CarroPickup extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY, new ConstantesFisica({
            velMaxAdelante : 0.7,
            aceleracion    : 0.0082,
            masa           : 1.4,
            agarre         : 0.9,
            direccion      : 0.01,
        }));
    }
}
