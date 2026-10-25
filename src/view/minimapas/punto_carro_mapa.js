'use strict';

// ================================================================
// CLASE: PuntoCarroMapa — dónde está un carro en la pista y cómo se
// marca en el minimapa de la carrera (PRD 017): su lugar real (x, z),
// el color de su auto y si es el jugador. Solo se lee (lección 3).
// ================================================================
class PuntoCarroMapa {
    #x = 0;
    #z = 0;
    #color = '#ffffff';
    #esJugador = false;

    constructor(x, z, color, esJugador) {
        this.#x = Number(x) || 0;
        this.#z = Number(z) || 0;
        this.#color = color;
        this.#esJugador = Boolean(esJugador);
    }

    get x()         { return this.#x; }
    get z()         { return this.#z; }
    get color()     { return this.#color; }
    get esJugador() { return this.#esJugador; }
}

window.PuntoCarroMapa = PuntoCarroMapa;
