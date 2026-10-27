'use strict';
try {

// ================================================================
// VIEW — AdaptadorDisenoCarrera: mantiene el diseño de una pantalla de
// carrera de acuerdo con la forma de la pantalla (PRD 015, D2 y D8).
// Lo aplica al crearse y cada vez que la pantalla cambia de tamaño o se
// gira el celular, sin tocar la carrera. También lleva las medidas del
// diseño a los controles (EstiloControlesCarrera, PRD 016) junto con el
// estilo de pedales que le pasen (PRD 021, D7). destruir()
// deja de escuchar y devuelve los controles a su estilo de siempre.
// ================================================================
class AdaptadorDisenoCarrera {
    #pantalla;
    #selector = new window.SelectorDisenoCarrera();
    #alCambiar;
    #estiloControles = null;   // EstiloControlesCarrera (si hay controles en la página)

    constructor(pantalla, clavePedales = null) {
        this.#pantalla  = pantalla;
        if (window.EstiloControlesCarrera && window.document) {
            this.#estiloControles = new window.EstiloControlesCarrera(window.document, clavePedales);
        }
        this.#alCambiar = () => this.#aplicar();
        window.addEventListener('resize', this.#alCambiar);
        window.addEventListener('orientationchange', this.#alCambiar);
        this.#aplicar();
    }

    destruir() {
        window.removeEventListener('resize', this.#alCambiar);
        window.removeEventListener('orientationchange', this.#alCambiar);
        if (this.#pantalla?.dataset) delete this.#pantalla.dataset.diseno;
        this.#estiloControles?.quitar();
        this.#estiloControles = null;
    }

    #aplicar() {
        const diseno = this.#selector.elegir();
        diseno.aplicar(this.#pantalla);
        this.#estiloControles?.aplicar(diseno);
    }
}

window.AdaptadorDisenoCarrera = AdaptadorDisenoCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[adaptador_diseno_carrera.js] ' + e.message);
    console.error('[adaptador_diseno_carrera.js]', e);
}
