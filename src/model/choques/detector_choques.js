'use strict';

import { ArbolSolido }      from './arbol_solido.js';
import { PosteSolido }      from './poste_solido.js';
import { SenalCurvaSolida } from './senal_curva_solida.js';

// ================================================================
// MODEL — DetectorChoques: choques del carro contra los objetos sólidos
// de la pista (PRD 008, D2, D4 y D6).
//   - Crea un ObjetoSolido por cada árbol, poste o señal de curva de los
//     datos de la pista, sin cambiarlos. Las flechas no son sólidas.
//   - Revisa el tramo recorrido en el paso (no solo el punto final), así
//     el carro no salta un objeto aunque vaya rápido.
//   - Al chocar deja el carro fuera del objeto: de frente rebota hacia
//     atrás; de costado pierde velocidad y sigue.
// ================================================================
export class DetectorChoques {
    static #RADIO_CARRO   = 0.8;
    static #HOLGURA       = 0.05;
    static #IMPACTO_FRENTE = 0.6;
    static #REBOTE        = -0.3;
    static #PERDIDA_ROCE  = 0.6;

    #objetos = [];

    constructor(decoraciones, ruta) {
        for (const dec of decoraciones ?? []) {
            const Clase = this.#claseDe(dec?.tipo);
            if (!Clase || !ruta) continue;
            const pos = ruta.posicionEn(dec.prog);
            const x = pos.x + Math.cos(pos.angle) * dec.dist * dec.lado;
            const z = pos.z - Math.sin(pos.angle) * dec.dist * dec.lado;
            this.#objetos.push(new Clase(x, z));
        }
    }

    get objetos() { return [...this.#objetos]; }

    #claseDe(tipo) {
        if (tipo === 'arbol')       return ArbolSolido;
        if (tipo === 'poste')       return PosteSolido;
        if (tipo === 'senal_curva') return SenalCurvaSolida;
        return null;
    }

    // Revisa el paso de (pxAntes, pzAntes) a la posición actual del carro.
    // Devuelve true si chocó.
    resolver(carro, pxAntes, pzAntes) {
        let choco = false;
        for (const objeto of this.#objetos) {
            if (this.resolverObjeto(carro, objeto, pxAntes, pzAntes)) choco = true;
        }
        return choco;
    }

    // Choque contra un solo objeto
    resolverObjeto(carro, objeto, pxAntes, pzAntes) {
        const minimo = objeto.radio + DetectorChoques.#RADIO_CARRO;
        const mx = carro.px - pxAntes, mz = carro.pz - pzAntes;
        const largo2 = mx * mx + mz * mz;
        // Punto del tramo recorrido más cercano al objeto
        let t = largo2 > 1e-12 ? ((objeto.x - pxAntes) * mx + (objeto.z - pzAntes) * mz) / largo2 : 1;
        t = Math.max(0, Math.min(1, t));
        const cx = pxAntes + mx * t, cz = pzAntes + mz * t;
        let nx = cx - objeto.x, nz = cz - objeto.z;
        const dist = Math.hypot(nx, nz);
        if (dist >= minimo) return false;

        if (dist > 1e-9) { nx /= dist; nz /= dist; }
        else if (largo2 > 1e-12) { const l = Math.sqrt(largo2); nx = -mx / l; nz = -mz / l; }
        else { nx = 1; nz = 0; }

        // Qué tan de frente golpea: 1 = de frente, 0 = de costado
        const dx = Math.sin(carro.velAngle) * Math.sign(carro.velocidad || 1);
        const dz = Math.cos(carro.velAngle) * Math.sign(carro.velocidad || 1);
        const impacto = Math.max(0, -(dx * nx + dz * nz));
        const factor = impacto > DetectorChoques.#IMPACTO_FRENTE
            ? DetectorChoques.#REBOTE
            : 1 - DetectorChoques.#PERDIDA_ROCE * impacto;
        const afuera = minimo + DetectorChoques.#HOLGURA;
        carro.rebotar(objeto.x + nx * afuera, objeto.z + nz * afuera, factor);
        return true;
    }
}
