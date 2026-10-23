'use strict';

// ================================================================
// VIEW — BuclePasoFijo: convierte el tiempo entre cuadros en pasos fijos
// de 60 Hz con un acumulador (la física queda igual en cualquier pantalla).
//   - Limita el salto de tiempo de un cuadro (MAX_DT_MS) y los pasos por
//     cuadro (MAX_PASOS) para evitar la espiral de pasos atrasados.
//   - No sabe qué se mueve: por cada paso llama a la función que recibe.
// ================================================================
export class BuclePasoFijo {
    static #MS_POR_PASO = 1000 / 60;
    static #MAX_PASOS   = 5;
    static #MAX_DT_MS   = 250;

    #ultimaMarca  = null;
    #acumuladorMs = 0;

    // Olvida la marca anterior: el próximo cuadro empieza con dt = 0
    reiniciar() {
        this.#ultimaMarca  = null;
        this.#acumuladorMs = 0;
    }

    // Descarta el tiempo acumulado sin olvidar la marca
    vaciar() {
        this.#acumuladorMs = 0;
    }

    // Avanza un cuadro. Si no está activo, solo mide el tiempo y vacía el
    // acumulador. Devuelve cuántos pasos fijos se dieron.
    avanzar(marca, activo, alPaso) {
        const ahora = Number.isFinite(marca) ? marca : performance.now();
        const dt    = this.#ultimaMarca === null
            ? 0
            : Math.min(BuclePasoFijo.#MAX_DT_MS, Math.max(0, ahora - this.#ultimaMarca));
        this.#ultimaMarca = ahora;

        let pasos = 0;
        if (!activo) {
            this.#acumuladorMs = 0;
            return pasos;
        }
        this.#acumuladorMs += dt;
        while (this.#acumuladorMs >= BuclePasoFijo.#MS_POR_PASO
               && pasos < BuclePasoFijo.#MAX_PASOS) {
            alPaso();
            this.#acumuladorMs -= BuclePasoFijo.#MS_POR_PASO;
            pasos++;
        }
        // Evita la espiral de pasos atrasados si el dispositivo va muy lento
        if (pasos === BuclePasoFijo.#MAX_PASOS)
            this.#acumuladorMs = Math.min(this.#acumuladorMs, BuclePasoFijo.#MS_POR_PASO);
        return pasos;
    }
}
