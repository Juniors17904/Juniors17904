'use strict';

// ================================================================
// CLASE: BotonesTactilesConduccion — conecta los botones táctiles
// GAS, REV, IZQ y DER (#btn-gas, #btn-rev, #btn-izq, #btn-der) a un
// visor 3D y los desconecta al salir. La usan Test Drive 3D simple y
// Diseño General (PRD 004 D6).
// ================================================================
class BotonesTactilesConduccion {
    #manejadores = [];

    conectar(visor) {
        this.#manejadores = [];
        this.#agregar('btn-gas', () => { visor.entradaAcel =  1; }, () => { visor.entradaAcel = 0; });
        this.#agregar('btn-rev', () => { visor.entradaAcel = -1; }, () => { visor.entradaAcel = 0; });
        this.#agregar('btn-izq', () => { visor.entradaDireccion = -1; }, () => { visor.entradaDireccion = 0; });
        this.#agregar('btn-der', () => { visor.entradaDireccion =  1; }, () => { visor.entradaDireccion = 0; });
    }

    desconectar() {
        for (const { el, alTocar, alSoltar } of this.#manejadores) {
            el.removeEventListener('touchstart', alTocar);
            el.removeEventListener('touchend',   alSoltar);
        }
        this.#manejadores = [];
    }

    #agregar(id, alTocar, alSoltar) {
        const el = document.getElementById(id);
        el.addEventListener('touchstart', alTocar, { passive: true });
        el.addEventListener('touchend',   alSoltar);
        this.#manejadores.push({ el, alTocar, alSoltar });
    }
}
