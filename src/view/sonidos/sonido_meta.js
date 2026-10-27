'use strict';

// ================================================================
// VIEW — SonidoMeta: la fanfarria corta al cruzar la meta y, si es récord
// nuevo (PRD 020), además una campanita (PRD 022, RF-05).
// ================================================================
class SonidoMeta extends window.EfectoSonido {
    static #NOTAS = [523, 659, 784, 1047];   // do, mi, sol, do

    sonar(esRecord = false) {
        SonidoMeta.#NOTAS.forEach((frecuencia, i) => this._tono('square', frecuencia, i * 0.12, i === 3 ? 0.6 : 0.16, 0.3));
        if (esRecord) {
            this._tono('sine', 1568, 0.75, 1.2, 0.4);
            this._tono('sine', 2093, 0.9, 1.2, 0.3);
        }
    }
}

window.SonidoMeta = SonidoMeta;
