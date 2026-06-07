'use strict';

// ================================================================
// CLASS: ControlTeclado — control por teclado (flechas / WASD)
//        Maneja conducción normal y panning de cámara aérea.
// ================================================================
class ControlTeclado extends ControlEntrada {
    #cir     = null;
    #keyDown = null;
    #keyUp   = null;

    mostrarOverlay() {
        document.getElementById('ctrl-timon').style.display   = 'none';
        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display   = 'flex';
    }

    ocultarOverlay() {
        document.getElementById('ctrl-botones').style.display = 'none';
        document.getElementById('ctrl-accel').style.display   = 'none';
    }

    activar(circuito) {
        this.#cir = circuito;

        this.#keyDown = e => {
            if (circuito.camAereaActiva && circuito.camAerea) {
                if (e.key === 'ArrowLeft'  || e.key === 'a') circuito.camAerea.moveX = -1;
                if (e.key === 'ArrowRight' || e.key === 'd') circuito.camAerea.moveX =  1;
                if (e.key === 'ArrowUp'    || e.key === 'w') circuito.camAerea.moveZ = -1;
                if (e.key === 'ArrowDown'  || e.key === 's') circuito.camAerea.moveZ =  1;
            } else {
                if (e.key === 'ArrowUp'    || e.key === 'w') circuito.entradaAcel =  1;
                if (e.key === 'ArrowDown'  || e.key === 's') circuito.entradaAcel = -1;
                if (e.key === 'ArrowLeft'  || e.key === 'a') circuito.entradaDireccion = -1;
                if (e.key === 'ArrowRight' || e.key === 'd') circuito.entradaDireccion =  1;
            }
        };
        this.#keyUp = e => {
            if (circuito.camAereaActiva && circuito.camAerea) {
                if (e.key === 'ArrowLeft'  || e.key === 'a' ||
                    e.key === 'ArrowRight' || e.key === 'd') circuito.camAerea.moveX = 0;
                if (e.key === 'ArrowUp'    || e.key === 'w' ||
                    e.key === 'ArrowDown'  || e.key === 's') circuito.camAerea.moveZ = 0;
            } else {
                if (e.key === 'ArrowUp'    || e.key === 'w' ||
                    e.key === 'ArrowDown'  || e.key === 's') circuito.entradaAcel = 0;
                if (e.key === 'ArrowLeft'  || e.key === 'a' ||
                    e.key === 'ArrowRight' || e.key === 'd') circuito.entradaDireccion = 0;
            }
        };
        window.addEventListener('keydown', this.#keyDown);
        window.addEventListener('keyup',   this.#keyUp);
    }

    destruir() {
        if (this.#keyDown) window.removeEventListener('keydown', this.#keyDown);
        if (this.#keyUp)   window.removeEventListener('keyup',   this.#keyUp);
        this.#keyDown = null;
        this.#keyUp   = null;
        if (this.#cir) { this.#cir.entradaAcel = 0; this.#cir.entradaDireccion = 0; }
        this.#cir = null;
    }
}

window.ControlTeclado = ControlTeclado;
