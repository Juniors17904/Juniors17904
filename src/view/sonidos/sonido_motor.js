'use strict';

// ================================================================
// VIEW — SonidoMotor: el motor del jugador (PRD 022, RF-01). Un tono
// grave continuo cuyo tono sube con la velocidad (de 0 a 1 respecto de
// la velocidad máxima). Solo el del jugador: los rivales no suenan (D3).
// ================================================================
class SonidoMotor extends window.EfectoSonido {
    static #TONO_QUIETO = 55;
    static #TONO_A_FONDO = 190;
    static #VOLUMEN = 0.22;

    #tono = null;   // [oscilador, volumen] mientras suena

    sonar(fraccion = 0) {
        if (!this.#tono) this.#tono = this._tonoContinuo('sawtooth', SonidoMotor.#TONO_QUIETO);
        if (!this.#tono) return;
        const f = Math.max(0, Math.min(1, Number(fraccion) || 0));
        this._llevar(this.#tono[0].frequency, SonidoMotor.#TONO_QUIETO + f * (SonidoMotor.#TONO_A_FONDO - SonidoMotor.#TONO_QUIETO));
        this._llevar(this.#tono[1].gain, SonidoMotor.#VOLUMEN);
    }

    callar() {
        super.callar();
        if (!this.#tono) return;
        try { this.#tono[0].stop(); } catch { /* ya parado */ }
        this.#tono = null;
    }
}

window.SonidoMotor = SonidoMotor;
