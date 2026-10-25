'use strict';
try {

// ================================================================
// VIEW — DisenoCarrera: cómo se acomoda una carrera 3D en la pantalla
// (PRD 015, D9). Superclase de DisenoVertical y DisenoHorizontal.
//   - anchoArea(): cuánto ancho usan la pista y el HUD.
//   - camaraVertical / fovCamara: qué cámara de seguimiento usa la pista.
//   - Controles (PRD 016, D4, D5 y D9): lado y separación de ACEL/FRENO, si
//     van apilados, cuánto alto ocupan abajo y cuánto hay que arrastrar
//     para el giro máximo. Por omisión, los del diseño horizontal.
//   - anchoMapa / altoMapa: tamaño del minimapa (PRD 017, D4).
//   - aplicar(pantalla): marca la pantalla con su nombre (data-diseno),
//     y el CSS acomoda la columna y los controles según esa marca.
// Sirve para cualquier carrera 3D, no solo la de un jugador (D11).
// ================================================================
class DisenoCarrera {
    static #MARGEN_INFERIOR = 6;

    get nombre() { return ''; }

    get camaraVertical() { return false; }
    get fovCamara()      { return 55; }

    get ladoPedal()         { return 88; }
    get separacionPedales() { return 16; }
    get pedalesApilados()   { return false; }
    // Alto que ocupan ACEL y FRENO desde el borde de abajo (con su margen)
    get altoControles() {
        const lado = this.ladoPedal, filas = this.pedalesApilados ? 2 : 1;
        return filas * lado + (filas - 1) * this.separacionPedales + DisenoCarrera.#MARGEN_INFERIOR;
    }
    recorridoGiro(anchoVentana) { return anchoVentana / 4; }
    // Minimapa de la carrera (PRD 017, D4): arriba a la derecha, bajo la barra
    get anchoMapa() { return 140; }
    get altoMapa()  { return 104; }

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
