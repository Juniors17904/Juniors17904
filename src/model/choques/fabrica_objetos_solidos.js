'use strict';

import { ArbolSolido }      from './arbol_solido.js';
import { PosteSolido }      from './poste_solido.js';
import { SenalCurvaSolida } from './senal_curva_solida.js';
import { FlechaCurvaSolida } from './flecha_curva_solida.js';

// ================================================================
// MODEL — FabricaObjetosSolidos: crea un ObjetoSolido por cada árbol,
// poste, señal de curva o flecha de curva de los datos de la pista, sin
// cambiarlos (PRD 008, D2 y D6; PRD 011, D6). Lo demás no es sólido.
// Al árbol le pasa su tamaño propio (la escala de la decoración, PRD 010 D3)
// y a la flecha el rumbo de la pista, para girar su tablero (PRD 011, D10).
// ================================================================
export class FabricaObjetosSolidos {
    // Misma posición que usa la vista: punto de la ruta + distancia al costado
    crear(decoraciones, ruta) {
        const objetos = [];
        if (!ruta) return objetos;
        for (const dec of decoraciones ?? []) {
            if (!dec) continue;
            const pos = ruta.posicionEn(dec.prog);
            const x = pos.x + Math.cos(pos.angle) * dec.dist * dec.lado;
            const z = pos.z - Math.sin(pos.angle) * dec.dist * dec.lado;
            const objeto = this.#crearUno(dec, x, z, pos.angle);
            if (objeto) objetos.push(objeto);
        }
        return objetos;
    }

    #crearUno(dec, x, z, rumbo) {
        switch (dec.tipo) {
            case 'arbol':       return new ArbolSolido(x, z, dec.escala ?? 1);
            case 'poste':       return new PosteSolido(x, z);
            case 'senal_curva': return new SenalCurvaSolida(x, z);
            case 'flecha':      return new FlechaCurvaSolida(x, z, rumbo);
            default:            return null;
        }
    }
}
