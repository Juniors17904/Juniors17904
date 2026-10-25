'use strict';

import { ObjetoSolido } from './objeto_solido.js';
import { PuntoChoque }  from './punto_choque.js';

// ================================================================
// MODEL — FlechaCurvaSolida: el tablero de una flecha de curva (PRD 011,
// D6 y D10). Choca el tablero entero: una tira del ancho del tablero a lo
// largo de la pista (rumbo), con la mitad de su grosor como radio. Sus
// medidas salen de MedidasEscena. Los palos quedan debajo del tablero.
// ================================================================
export class FlechaCurvaSolida extends ObjetoSolido {
    static #BUSQUEDAS = 24;   // vueltas de la búsqueda del punto más cercano

    #radio;
    #medioAncho;
    #dx; #dz;   // a lo largo del tablero

    constructor(x, z, rumbo = 0) {
        super(x, z);
        const medidas = new globalThis.MedidasEscena();
        this.#radio      = medidas.grosorTableroFlecha / 2;
        this.#medioAncho = medidas.anchoTableroFlecha / 2;
        this.#dx = Math.sin(rumbo);
        this.#dz = Math.cos(rumbo);
    }

    get radio()   { return this.#radio; }
    get tipo()    { return 'flecha'; }
    get alcance() { return this.#medioAncho + this.#radio; }

    // Punto del tablero más cercano al carro (o el que más se metió en él):
    // la distancia al rectángulo crece pareja a cada lado del mínimo, así
    // que se busca por tercios
    puntoCercano(rectangulo) {
        let a = -this.#medioAncho, b = this.#medioAncho;
        for (let i = 0; i < FlechaCurvaSolida.#BUSQUEDAS; i++) {
            const t1 = a + (b - a) / 3, t2 = b - (b - a) / 3;
            if (this.#distancia(rectangulo, t1) <= this.#distancia(rectangulo, t2)) b = t2;
            else a = t1;
        }
        const t = (a + b) / 2;
        return new PuntoChoque(this.x + this.#dx * t, this.z + this.#dz * t);
    }

    #distancia(rectangulo, t) {
        return rectangulo.distanciaA(this.x + this.#dx * t, this.z + this.#dz * t);
    }
}
