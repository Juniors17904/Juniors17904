'use strict';

import { TrazadoPiso } from './trazado_piso.js';

// ================================================================
// VIEW — TrazadoPisoRecto: el centro de una recta abierta sobre x = 0,
// de zInicio a zInicio + largo (Test Drive simple). El final no se une
// con el inicio.
// ================================================================
export class TrazadoPisoRecto extends TrazadoPiso {
    constructor(largo, zInicio = 0, pasoMaximo = 0.5) {
        const n = Math.max(1, Math.ceil(largo / pasoMaximo));
        const xs = [], zs = [], txs = [], tzs = [];
        for (let i = 0; i <= n; i++) {
            xs.push(0); zs.push(zInicio + largo * i / n); txs.push(0); tzs.push(1);
        }
        super(false, xs, zs, txs, tzs);
    }
}
