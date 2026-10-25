'use strict';

// ================================================================
// MODEL — FilaPosicion: un puesto de la tabla de la carrera (PRD 013, D5):
// puesto (1 a 5), nombre, si es el jugador, si ya terminó y su tiempo
// total (null mientras sigue en carrera). Solo lectura.
// ================================================================
export class FilaPosicion {
    #puesto; #nombre; #esJugador; #terminado; #tiempoMs;

    constructor(puesto, nombre, esJugador, terminado, tiempoMs) {
        this.#puesto    = puesto;
        this.#nombre    = String(nombre ?? '');
        this.#esJugador = Boolean(esJugador);
        this.#terminado = Boolean(terminado);
        this.#tiempoMs  = this.#terminado && Number.isFinite(tiempoMs) ? tiempoMs : null;
    }

    get puesto()    { return this.#puesto; }
    get nombre()    { return this.#nombre; }
    get esJugador() { return this.#esJugador; }
    get terminado() { return this.#terminado; }
    get tiempoMs()  { return this.#tiempoMs; }
}
