'use strict';

// ================================================================
// CLASE: ToqueBotonConduccion — un botón táctil de conducción (GAS,
// REV, IZQ o DER) conectado a un visor: guarda el elemento y sus dos
// manejadores para poder quitarlos al salir (PRD 004 D6, lección 3).
// ================================================================
class ToqueBotonConduccion {
    #elemento = null;
    #alTocar  = null;
    #alSoltar = null;

    constructor(id, alTocar, alSoltar) {
        this.#elemento = document.getElementById(id);
        this.#alTocar  = alTocar;
        this.#alSoltar = alSoltar;
    }

    conectar() {
        this.#elemento.addEventListener('touchstart', this.#alTocar, { passive: true });
        this.#elemento.addEventListener('touchend',   this.#alSoltar);
    }

    desconectar() {
        this.#elemento.removeEventListener('touchstart', this.#alTocar);
        this.#elemento.removeEventListener('touchend',   this.#alSoltar);
    }
}
