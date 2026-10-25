'use strict';
try {

// ================================================================
// VIEW — SelectorDisenoCarrera: elige el diseño por la forma de la
// pantalla (PRD 015, D8): más ancha que alta es horizontal; si no,
// vertical. Lo usan el HUD, el visor y AdaptadorDisenoCarrera, así
// todos usan la misma regla.
// ================================================================
class SelectorDisenoCarrera {
    elegir(ancho = window.innerWidth, alto = window.innerHeight) {
        return ancho > alto ? new window.DisenoHorizontal() : new window.DisenoVertical();
    }
}

window.SelectorDisenoCarrera = SelectorDisenoCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[selector_diseno_carrera.js] ' + e.message);
    console.error('[selector_diseno_carrera.js]', e);
}
