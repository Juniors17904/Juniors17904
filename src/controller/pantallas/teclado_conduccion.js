'use strict';

// ================================================================
// CLASE: TecladoConduccion — flechas y WASD para manejar el visor del
// Test Drive 3D simple; se conecta al entrar y se quita al salir.
// ================================================================
class TecladoConduccion {
    #teclaAbajo  = null;
    #teclaArriba = null;

    conectar(visor) {
        this.desconectar();
        this.#teclaAbajo = e => {
            if (e.key === 'ArrowUp'    || e.key === 'w') visor.entradaAcel =  1;
            if (e.key === 'ArrowDown'  || e.key === 's') visor.entradaAcel = -1;
            if (e.key === 'ArrowLeft'  || e.key === 'a') visor.entradaDireccion = -1;
            if (e.key === 'ArrowRight' || e.key === 'd') visor.entradaDireccion =  1;
        };
        this.#teclaArriba = e => {
            if (e.key === 'ArrowUp'   || e.key === 'w' ||
                e.key === 'ArrowDown' || e.key === 's') visor.entradaAcel = 0;
            if (e.key === 'ArrowLeft' || e.key === 'a' ||
                e.key === 'ArrowRight'|| e.key === 'd') visor.entradaDireccion = 0;
        };
        window.addEventListener('keydown', this.#teclaAbajo);
        window.addEventListener('keyup',   this.#teclaArriba);
    }

    desconectar() {
        if (this.#teclaAbajo)  window.removeEventListener('keydown', this.#teclaAbajo);
        if (this.#teclaArriba) window.removeEventListener('keyup',   this.#teclaArriba);
        this.#teclaAbajo  = null;
        this.#teclaArriba = null;
    }
}
