'use strict';

// ================================================================
// CLASE: ControladorPantallaJuego — superclase de los controladores
// que arrancan un visor 3D en la pantalla de juego (#pantalla-juego):
// ControladorTestDrive3D y ControladorDisenoPistas (PRD 004 D6).
// Lleva la marca de "arranque pedido pero visor aún no creado" que
// Aplicacion consulta para no redirigir a Inicio (PRD 002 RF-09).
// Cada subclase dice si tiene visor con el getter tieneVisor.
// ================================================================
class ControladorPantallaJuego extends ControladorPantalla {
    #arrancando = false;

    // Hay un visor cargado o arrancando en la pantalla de juego (PRD 002 RF-09)
    get ocupaPantallaJuego() {
        return Boolean(this.tieneVisor || this.#arrancando);
    }

    // La subclase lo redefine: true si su visor está creado
    get tieneVisor() {
        return false;
    }

    // Aplicacion lo llama al navegar fuera de la pantalla de juego
    cancelarArranque() {
        this.#arrancando = false;
    }

    // ── Uso de las subclases ─────────────────────────────────────
    get arrancando() {
        return this.#arrancando;
    }

    marcarArranque() {
        this.#arrancando = true;
    }
}
