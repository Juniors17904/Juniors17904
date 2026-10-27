'use strict';

// ================================================================
// VIEW — SonidoLlantas: el chirrido de las llantas al derrapar o frenar
// fuerte (PRD 022, RF-03). Un tono agudo continuo que se oye mientras
// dura el derrape y se calla al terminar.
// ================================================================
class SonidoLlantas extends window.EfectoSonido {
    static #TONO = 1400;
    static #VOLUMEN = 0.07;

    #tono = null;

    sonar(chirriando) {
        if (chirriando && !this.#tono) this.#tono = this._tonoContinuo('square', SonidoLlantas.#TONO);
        if (!this.#tono) return;
        this._llevar(this.#tono[1].gain, chirriando ? SonidoLlantas.#VOLUMEN : 0);
    }

    callar() {
        if (!this.#tono) return;
        try { this.#tono[0].stop(); } catch { /* ya parado */ }
        this.#tono = null;
    }
}

window.SonidoLlantas = SonidoLlantas;
