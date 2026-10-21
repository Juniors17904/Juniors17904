'use strict';

// ================================================================
// CONTROLLER — ModosDisponibles: registro de modos (PRD 002 D8)
// Es el ÚNICO lugar que decide el estado de cada modo:
//   disponible    → se ve y se abre
//   próximamente  → se ve pero no se abre (D2)
//   oculto        → ni se ve ni se abre (D1)
// Para cambiar el estado de un modo basta con moverlo de lista aquí.
// ================================================================

try {

class ModosDisponibles {
    #disponibles;
    #proximamente;
    #ocultos;

    constructor() {
        this.#disponibles  = Object.freeze([new ModoJugarSolo(),    new ModoTestDrive3D()]);  // D1
        this.#proximamente = Object.freeze([new ModoMultijugador(), new ModoUnirse()]);       // D2
        this.#ocultos      = Object.freeze([new ModoClasico2D(),    new ModoTestDrive2D()]);  // D1
    }

    // ── Getters ─────────────────────────────────────────────────

    get todos() { return [...this.#disponibles, ...this.#proximamente, ...this.#ocultos]; }

    // ── Estado de un modo (por clase, sin comparar textos) ──────

    estaDisponible(ClaseModo) { return this.#disponibles.some(m => m instanceof ClaseModo); }
    estaProximamente(ClaseModo) { return this.#proximamente.some(m => m instanceof ClaseModo); }
    estaOculto(ClaseModo)     { return this.#ocultos.some(m => m instanceof ClaseModo); }

    // ── Aplicar a la página ─────────────────────────────────────

    // Oculta los botones de los modos ocultos y marca "Próximamente" los otros
    aplicarA(documento) {
        for (const modo of this.#ocultos)      modo.ocultarBotones(documento);
        for (const modo of this.#proximamente) modo.marcarProximamente(documento);
    }

    // ── Pertenencia de pantallas (D3) ───────────────────────────

    // La pantalla es de algún modo que no se puede abrir (oculto o próximamente)
    esPantallaDeModoNoDisponible(idPantalla) {
        return this.#tienePantalla(this.#ocultos, idPantalla)
            || this.#tienePantalla(this.#proximamente, idPantalla);
    }

    // La pantalla también la usa un modo disponible (p. ej. pantalla-juego con Test Drive 3D)
    esPantallaDeModoDisponible(idPantalla) {
        return this.#tienePantalla(this.#disponibles, idPantalla);
    }

    // RF-08 / RF-09: true si al llegar a esta pantalla hay que mostrar Inicio.
    // hayVisor3D = hay un visor 3D cargado o arrancando.
    debeRedirigirAInicio(idPantalla, hayVisor3D) {
        if (!this.esPantallaDeModoNoDisponible(idPantalla)) return false;
        return !(hayVisor3D && this.esPantallaDeModoDisponible(idPantalla));
    }

    #tienePantalla(modos, idPantalla) {
        return modos.some(m => m.tienePantalla(idPantalla));
    }
}

window.ModosDisponibles = ModosDisponibles;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modos_disponibles.js] ' + e.message);
    console.error('[modos_disponibles.js]', e);
}
