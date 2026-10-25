'use strict';
try {

// ================================================================
// VIEW — DisenoCarrera: cómo se acomoda una carrera 3D en la pantalla
// (PRD 015, D9). Superclase de DisenoVertical y DisenoHorizontal.
//   - anchoArea(): cuánto ancho usan la pista y el HUD.
//   - aplicar(pantalla): marca la pantalla con su nombre (data-diseno),
//     y el CSS acomoda la columna y los controles según esa marca.
// Sirve para cualquier carrera 3D, no solo la de un jugador (D11).
// ================================================================
class DisenoCarrera {
    get nombre() { return ''; }

    anchoArea(anchoVentana) { return anchoVentana; }

    aplicar(pantalla) {
        if (pantalla?.dataset) pantalla.dataset.diseno = this.nombre;
    }
}

window.DisenoCarrera = DisenoCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[diseno_carrera.js] ' + e.message);
    console.error('[diseno_carrera.js]', e);
}
