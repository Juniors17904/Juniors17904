'use strict';

// ================================================================
// MODEL — SuperficiePiano: el borde rojo y blanco. Frena poco:
// más que el asfalto y mucho menos que el pasto (PRD 008, RF-04).
// ================================================================
class SuperficiePiano extends window.Superficie {
    get nombre()     { return 'piano'; }
    get rozamiento() { return 0.35; }
}

window.SuperficiePiano = SuperficiePiano;
