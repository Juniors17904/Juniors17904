'use strict';

// ================================================================
// CLASE: ControladorPantalla — superclase de los controladores de
// pantalla (PRD 004 D6). Define la interfaz común:
//   iniciar() → registra los eventos de su pantalla
//   detener() → libera lo que su pantalla tenga activo
// La navegación la hace Aplicacion (D5): el controlador solo pide
// ir a otra pantalla con irA(id).
// ================================================================
class ControladorPantalla {
    #navegar = null;

    constructor(navegar) {
        this.#navegar = typeof navegar === 'function' ? navegar : null;
    }

    iniciar() {}

    detener() {}

    // Pide a Aplicacion que muestre otra pantalla
    irA(id) {
        if (this.#navegar) this.#navegar(id);
    }
}
