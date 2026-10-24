'use strict';

import { Carro }            from './carro.js';
import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — CarroDeportivo: física del modelo "deportivo" del garaje (PRD 007)
//   alta velocidad, giro preciso y buen agarre.
// ================================================================
export class CarroDeportivo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY, new ConstantesFisica({
            velMaxAdelante : 0.8,
            aceleracion    : 0.0074,
            masa           : 0.95,
            agarre         : 1.15,
            direccion      : 0.011,
        }));
    }
}
