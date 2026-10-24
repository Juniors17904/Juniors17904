'use strict';

// ================================================================
// CLASE: LimpiadorPantallaJuego — deja vacía la pantalla de juego
// (#pantalla-juego), que comparten el Test Drive 3D simple y el
// circuito 3D: detiene los dos y oculta sus canvas y overlays antes
// de que uno de ellos arranque (PRD 004 D6).
// ================================================================
class LimpiadorPantallaJuego {
    static #OCULTOS = [
        'canvas-td3d', 'canvas-cir3d', 'titulo-td3d', 'titulo-cir3d',
        'btn-exit-td3d', 'btn-exit-cir3d', 'ctrl-botones', 'ctrl-accel',
        'ctrl-cam-height', 'debug-td3d', 'debug-path', 'minimap-td3d',
        'trail-map', 'btn-toggle-minimap', 'btn-toggle-trail',
        'btn-toggle-datos', 'btn-toggle-mapas', 'btn-cam-aerea',
    ];

    #testDrive3D  = null;
    #disenoPistas = null;

    constructor(testDrive3D, disenoPistas) {
        this.#testDrive3D  = testDrive3D;
        this.#disenoPistas = disenoPistas;
    }

    limpiar() {
        this.#testDrive3D.detener();
        this.#disenoPistas.detener();
        for (const id of LimpiadorPantallaJuego.#OCULTOS) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
    }
}
