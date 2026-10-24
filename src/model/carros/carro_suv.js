'use strict';

import { Carro }            from './carro.js';
import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — CarroSUV: física del modelo "suv" del garaje (PRD 007)
//   pesado y alto: acelera y frena lento, derrapa más.
// ================================================================
export class CarroSUV extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY, new ConstantesFisica({
            velMaxAdelante : 0.68,
            aceleracion    : 0.0078,
            masa           : 1.35,
            agarre         : 0.85,
            direccion      : 0.0102,
        }));
    }
}
