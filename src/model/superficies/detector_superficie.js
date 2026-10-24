'use strict';

// ================================================================
// MODEL — DetectorSuperficie: qué superficie hay a una distancia lateral
// del centro de la pista (PRD 008, D5). Conoce el ancho del asfalto y del
// piano, que antes solo sabía la vista. No toca Ruta.
// ================================================================
class DetectorSuperficie {
    static #MEDIO_ANCHO  = 4;     // asfalto: de -4 a 4
    static #LIMITE_PIANO = 4.7;   // piano: de 4 a 4.7; más afuera, pasto

    #asfalto = new window.SuperficieAsfalto();
    #piano   = new window.SuperficiePiano();
    #pasto   = new window.SuperficiePasto();

    superficieEn(lateral) {
        const d = Math.abs(Number(lateral) || 0);
        if (d <= DetectorSuperficie.#MEDIO_ANCHO)  return this.#asfalto;
        if (d <= DetectorSuperficie.#LIMITE_PIANO) return this.#piano;
        return this.#pasto;
    }
}

window.DetectorSuperficie = DetectorSuperficie;
