'use strict';

import { ArbolSolido }      from './arbol_solido.js';
import { PosteSolido }      from './poste_solido.js';
import { SenalCurvaSolida } from './senal_curva_solida.js';

// ================================================================
// MODEL — FabricaObjetosSolidos: crea un ObjetoSolido por cada árbol,
// poste o señal de curva de los datos de la pista, sin cambiarlos
// (PRD 008, D2 y D6). Las flechas y lo demás no son sólidos.
// ================================================================
export class FabricaObjetosSolidos {
    #clases = new Map([
        ['arbol',       ArbolSolido],
        ['poste',       PosteSolido],
        ['senal_curva', SenalCurvaSolida],
    ]);

    // Misma posición que usa la vista: punto de la ruta + distancia al costado
    crear(decoraciones, ruta) {
        const objetos = [];
        if (!ruta) return objetos;
        for (const dec of decoraciones ?? []) {
            const Clase = this.#clases.get(dec?.tipo);
            if (!Clase) continue;
            const pos = ruta.posicionEn(dec.prog);
            objetos.push(new Clase(
                pos.x + Math.cos(pos.angle) * dec.dist * dec.lado,
                pos.z - Math.sin(pos.angle) * dec.dist * dec.lado,
            ));
        }
        return objetos;
    }
}
