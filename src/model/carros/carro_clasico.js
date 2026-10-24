'use strict';

import { Carro }            from './carro.js';
import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — CarroClasico: física del modelo "clasico" del garaje (PRD 007)
//   equilibrado y algo blando en curva.
// ================================================================
export class CarroClasico extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY, new ConstantesFisica({
            velMaxAdelante : 0.74,
            aceleracion    : 0.0072,
            masa           : 1.1,
            agarre         : 0.95,
            direccion      : 0.0103,
        }));
    }
}
