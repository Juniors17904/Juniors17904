'use strict';

// ================================================================
// VIEW — PreferenciaSonido: recuerda si el sonido de la carrera está
// prendido (🔊) o apagado (🔇) (PRD 022, D5). Se guarda en el navegador
// con su propia clave; la primera vez el sonido está prendido. Sin
// almacenamiento, se recuerda solo mientras el juego está abierto.
// ================================================================
class PreferenciaSonido {
    static #CLAVE = 'tr_sonido';

    #almacen;
    #prendido = true;

    constructor(almacen = null) {
        this.#almacen = almacen ?? this.#almacenNavegador();
        try { this.#prendido = this.#almacen?.getItem(PreferenciaSonido.#CLAVE) !== 'apagado'; } catch { this.#prendido = true; }
    }

    get prendido() { return this.#prendido; }
    set prendido(valor) {
        this.#prendido = Boolean(valor);
        try { this.#almacen?.setItem(PreferenciaSonido.#CLAVE, this.#prendido ? 'prendido' : 'apagado'); } catch { /* sin almacenamiento */ }
    }

    #almacenNavegador() {
        try { return window.localStorage ?? null; } catch { return null; }
    }
}

window.PreferenciaSonido = PreferenciaSonido;
