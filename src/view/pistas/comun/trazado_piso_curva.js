'use strict';

import { TrazadoPiso } from './trazado_piso.js';

// ================================================================
// VIEW — TrazadoPisoCurva: el centro de una pista cerrada (curva
// CatmullRom de Ruta), muestreado cada pasoMaximo metros o menos.
// ================================================================
export class TrazadoPisoCurva extends TrazadoPiso {
    static #MUESTRAS_MINIMAS = 8;

    constructor(curva, pasoMaximo = 0.5) {
        const n = Math.max(TrazadoPisoCurva.#MUESTRAS_MINIMAS, Math.ceil(curva.getLength() / pasoMaximo));
        const xs = [], zs = [], txs = [], tzs = [];
        for (let i = 0; i < n; i++) {
            const u = i / n;
            const p = curva.getPointAt(u);
            const t = curva.getTangentAt(u);
            xs.push(p.x); zs.push(p.z); txs.push(t.x); tzs.push(t.z);
        }
        super(true, xs, zs, txs, tzs);
    }
}
