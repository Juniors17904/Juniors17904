'use strict';

// ================================================================
// MODEL — EleccionCarrera: cómo quiere correr el jugador en Jugar Solo
// (PRD 018): el modo (ModoCarrera), la dificultad (DificultadCarrera) y
// cuántos rivales (de 1 a 4). La pista la guarda EstadoJuego, como siempre.
// En Contrarreloj no corre ningún rival (D2).
// ================================================================
class EleccionCarrera {
    static #MIN_RIVALES = 1;
    static #MAX_RIVALES = 4;

    #modo;
    #dificultad;
    #rivales = EleccionCarrera.#MAX_RIVALES;

    constructor(modo, dificultad, rivales = EleccionCarrera.#MAX_RIVALES) {
        this.#modo       = modo ?? new window.ModoContraPC();
        this.#dificultad = dificultad ?? new window.DificultadNormal();
        this.rivales     = rivales;
    }

    get modo()        { return this.#modo; }
    get dificultad()  { return this.#dificultad; }
    get rivales()     { return this.#rivales; }
    get maxRivales()  { return EleccionCarrera.#MAX_RIVALES; }
    get hayRivales()  { return this.#modo.hayRivales; }
    // Rivales que de verdad corren en la pista
    get cantidadRivales() { return this.hayRivales ? this.#rivales : 0; }

    set modo(valor)       { if (valor instanceof window.ModoCarrera) this.#modo = valor; }
    set dificultad(valor) { if (valor instanceof window.DificultadCarrera) this.#dificultad = valor; }
    set rivales(valor) {
        const n = Math.round(Number(valor));
        this.#rivales = Number.isFinite(n)
            ? Math.max(EleccionCarrera.#MIN_RIVALES, Math.min(EleccionCarrera.#MAX_RIVALES, n))
            : EleccionCarrera.#MAX_RIVALES;
    }
}

window.EleccionCarrera = EleccionCarrera;
