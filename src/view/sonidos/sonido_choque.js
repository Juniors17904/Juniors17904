'use strict';

// ================================================================
// VIEW — SonidoChoque: un golpe seco y grave al chocar contra un árbol,
// un poste o un rival (PRD 022, RF-04).
// ================================================================
class SonidoChoque extends window.EfectoSonido {
    sonar() {
        this._tono('triangle', 90, 0, 0.25, 0.9);
        this._tono('square', 45, 0, 0.18, 0.5);
    }
}

window.SonidoChoque = SonidoChoque;
