'use strict';

import { RectanguloCarro } from './rectangulo_carro.js';

// ================================================================
// MODEL — ChoqueEntreCarros: dos carros no se atraviesan (PRD 013, D7, RF-11).
//   - Cada carro es el rectángulo de su largo y su ancho, girado con él
//     (RectanguloCarro, PRD 009 D6), como en los choques con objetos.
//   - Primero mira si están cerca (revisa solo lo cercano, PRD 011 RNF-04);
//     después busca el eje en que se tocan menos (ejes separadores).
//   - Si se tocan, separa a los dos por partes iguales con rebotar y cada uno
//     pierde algo de velocidad: más cuanto más de frente iba contra el otro.
// No cambia DetectorChoques: los choques con árboles, postes y señales
// siguen allí.
// ================================================================
export class ChoqueEntreCarros {
    static #HOLGURA       = 0.02;
    static #PERDIDA_MINIMA = 0.03;   // todo toque cuesta algo de velocidad
    static #PERDIDA_FRENTE = 0.35;   // de frente contra el otro pierde más

    // true si los carros se tocaban (y ya quedaron separados)
    resolver(carroA, medidaA, carroB, medidaB) {
        if (!carroA || !carroB || carroA === carroB || !medidaA || !medidaB) return false;
        const a = new RectanguloCarro(carroA.px, carroA.pz, carroA.rotY, medidaA.largo / 2, medidaA.ancho / 2);
        const b = new RectanguloCarro(carroB.px, carroB.pz, carroB.rotY, medidaB.largo / 2, medidaB.ancho / 2);
        const dx = b.x - a.x, dz = b.z - a.z;
        const lejos = a.alcance + b.alcance;
        if (Math.abs(dx) > lejos || Math.abs(dz) > lejos) return false;

        let mejor = Infinity, nx = 0, nz = 0;
        for (const [ex, ez] of [[a.fx, a.fz], [a.sx, a.sz], [b.fx, b.fz], [b.sx, b.sz]]) {
            const solape = this.#radio(a, ex, ez) + this.#radio(b, ex, ez) - Math.abs(dx * ex + dz * ez);
            if (solape <= 0) return false;
            if (solape < mejor) {
                mejor = solape;
                const signo = dx * ex + dz * ez >= 0 ? 1 : -1;   // de A hacia B
                nx = ex * signo; nz = ez * signo;
            }
        }
        const mitad = mejor / 2 + ChoqueEntreCarros.#HOLGURA;
        const factorA = this.#factor(carroA, nx, nz);
        const factorB = this.#factor(carroB, -nx, -nz);
        carroA.rebotar(carroA.px - nx * mitad, carroA.pz - nz * mitad, factorA);
        carroB.rebotar(carroB.px + nx * mitad, carroB.pz + nz * mitad, factorB);
        return true;
    }

    // Medio ancho del rectángulo visto sobre el eje (ex, ez)
    #radio(r, ex, ez) {
        return r.medioLargo * Math.abs(r.fx * ex + r.fz * ez) + r.medioAncho * Math.abs(r.sx * ex + r.sz * ez);
    }

    // Cuánta velocidad le queda: 1 − pérdida; la pérdida crece si iba hacia el otro
    #factor(carro, nx, nz) {
        const signo = Math.sign(carro.velocidad) || 1;
        const haciaOtro = Math.max(0, (Math.sin(carro.velAngle) * nx + Math.cos(carro.velAngle) * nz) * signo);
        return 1 - ChoqueEntreCarros.#PERDIDA_MINIMA - ChoqueEntreCarros.#PERDIDA_FRENTE * haciaOtro;
    }
}
