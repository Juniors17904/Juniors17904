'use strict';

import { Carro }            from './carro.js';
import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — CarroFormula: física del modelo "formula" del garaje (PRD 007)
//   liviano: acelera fuerte y tiene el mayor agarre.
// ================================================================
export class CarroFormula extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY, new ConstantesFisica({
            velMaxAdelante : 0.82,
            aceleracion    : 0.007,
            masa           : 0.8,
            agarre         : 1.3,
            direccion      : 0.0115,
        }));
    }
}
