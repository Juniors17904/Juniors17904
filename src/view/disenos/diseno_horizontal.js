'use strict';
try {

// ================================================================
// VIEW — DisenoHorizontal: la carrera con el celular acostado o en una
// ventana más ancha que alta (PRD 015, D5 y D7). La pista y el HUD usan
// todo el ancho; el timón queda abajo a la izquierda y ACEL/FRENO abajo a
// la derecha, con el velocímetro encima (lo acomoda el CSS). La cámara
// es la de seguimiento común, con 55° de visión. ACEL y FRENO van lado a
// lado como pedales, de 88 px, y el giro máximo pide un cuarto del ancho
// (PRD 016): todo eso son los valores de DisenoCarrera.
// ================================================================
class DisenoHorizontal extends window.DisenoCarrera {
    get nombre() { return 'horizontal'; }
}

window.DisenoHorizontal = DisenoHorizontal;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[diseno_horizontal.js] ' + e.message);
    console.error('[diseno_horizontal.js]', e);
}
