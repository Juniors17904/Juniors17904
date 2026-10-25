'use strict';
try {

// ================================================================
// VIEW — RespuestaToque: hace que se note cuando se aprieta un botón de
// la carrera (PRD 016, D6). Mientras se aprieta, el botón lleva la clase
// "apretado" (el CSS lo ilumina y lo hunde); al empezar, el celular vibra
// muy corto si lo permite. Escucha con sus propios eventos, sin tocar lo
// que hace el botón. destruir() deja de escuchar.
// ================================================================
class RespuestaToque {
    static #VIBRACION_MS = 12;

    #escuchas = [];

    constructor(botones) {
        for (const boton of botones ?? []) {
            if (!boton) continue;
            const apretar = () => {
                boton.classList.add('apretado');
                try { navigator.vibrate?.(RespuestaToque.#VIBRACION_MS); } catch { /* sin vibración */ }
            };
            const soltar = () => boton.classList.remove('apretado');
            const eventos = [['touchstart', apretar], ['mousedown', apretar], ['touchend', soltar],
                ['touchcancel', soltar], ['mouseup', soltar], ['mouseleave', soltar]];
            for (const [tipo, fn] of eventos) boton.addEventListener(tipo, fn, { passive: true });
            this.#escuchas.push([boton, eventos]);
        }
    }

    destruir() {
        for (const [boton, eventos] of this.#escuchas) {
            for (const [tipo, fn] of eventos) boton.removeEventListener(tipo, fn);
            boton.classList.remove('apretado');
        }
        this.#escuchas = [];
    }
}

window.RespuestaToque = RespuestaToque;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[respuesta_toque.js] ' + e.message);
    console.error('[respuesta_toque.js]', e);
}
