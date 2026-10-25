'use strict';

// ================================================================
// MODEL — AzarSemilla: números al azar que se repiten con la misma
// semilla (PRD 013, D6). Los pilotos de la PC lo usan en vez del
// azar del navegador para que las pruebas den siempre lo mismo (RF-05).
// Algoritmo mulberry32: rápido y suficiente para un juego.
// ================================================================
export class AzarSemilla {
    #estado;

    constructor(semilla = 1) {
        this.#estado = (Math.floor(Number(semilla)) || 0) >>> 0;
    }

    // Número en [0, 1)
    siguiente() {
        this.#estado = (this.#estado + 0x6D2B79F5) >>> 0;
        let t = this.#estado;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Número en [min, max)
    entre(min, max) { return min + (max - min) * this.siguiente(); }
}
