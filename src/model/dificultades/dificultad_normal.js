'use strict';

// ================================================================
// MODEL — DificultadNormal: la carrera de siempre (PRD 013): los rivales
// aflojan para esperar al jugador y arriesgan si quedan atrás (PRD 018, D4).
// Usa los valores de DificultadCarrera.
// ================================================================
class DificultadNormal extends window.DificultadCarrera {
    get clave()  { return 'normal'; }
    get nombre() { return 'Normal'; }
}

window.DificultadNormal = DificultadNormal;
