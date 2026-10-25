'use strict';

// ================================================================
// MODEL — ParticipanteCarrera: lo que TablaPosiciones necesita saber de
// un carro en un instante (PRD 013, D5): nombre, si es el jugador, si
// terminó, su tiempo total y su avance (vueltas completas + progreso).
// Solo lectura.
// ================================================================
export class ParticipanteCarrera {
    #nombre; #esJugador; #terminado; #tiempoTotalMs; #avance;

    constructor(nombre, esJugador, terminado, tiempoTotalMs, avance) {
        this.#nombre        = nombre;
        this.#esJugador     = Boolean(esJugador);
        this.#terminado     = Boolean(terminado);
        this.#tiempoTotalMs = Number(tiempoTotalMs) || 0;
        this.#avance        = Number(avance) || 0;
    }

    get nombre()        { return this.#nombre; }
    get esJugador()     { return this.#esJugador; }
    get terminado()     { return this.#terminado; }
    get tiempoTotalMs() { return this.#tiempoTotalMs; }
    get avance()        { return this.#avance; }
}
