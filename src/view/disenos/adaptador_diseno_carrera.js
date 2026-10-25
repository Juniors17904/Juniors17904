'use strict';
try {

// ================================================================
// VIEW — AdaptadorDisenoCarrera: mantiene el diseño de una pantalla de
// carrera de acuerdo con la forma de la pantalla (PRD 015, D2 y D8).
// Lo aplica al crearse y cada vez que la pantalla cambia de tamaño o se
// gira el celular, sin tocar la carrera. destruir() deja de escuchar.
// ================================================================
class AdaptadorDisenoCarrera {
    #pantalla;
    #selector = new window.SelectorDisenoCarrera();
    #alCambiar;

    constructor(pantalla) {
        this.#pantalla  = pantalla;
        this.#alCambiar = () => this.#aplicar();
        window.addEventListener('resize', this.#alCambiar);
        window.addEventListener('orientationchange', this.#alCambiar);
        this.#aplicar();
    }

    destruir() {
        window.removeEventListener('resize', this.#alCambiar);
        window.removeEventListener('orientationchange', this.#alCambiar);
        if (this.#pantalla?.dataset) delete this.#pantalla.dataset.diseno;
    }

    #aplicar() {
        this.#selector.elegir().aplicar(this.#pantalla);
    }
}

window.AdaptadorDisenoCarrera = AdaptadorDisenoCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[adaptador_diseno_carrera.js] ' + e.message);
    console.error('[adaptador_diseno_carrera.js]', e);
}
