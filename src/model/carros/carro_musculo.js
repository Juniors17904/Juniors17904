'use strict';

import { Carro }            from './carro.js';
import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — CarroMusculo: física del modelo "muscle" del garaje (PRD 007)
//   mucha potencia y tope alto, pero poco agarre.
// ================================================================
export class CarroMusculo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY, new ConstantesFisica({
            velMaxAdelante : 0.84,
            aceleracion    : 0.009,
            masa           : 1.2,
            agarre         : 0.8,
            direccion      : 0.0098,
        }));
    }
}
