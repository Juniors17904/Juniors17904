'use strict';

// ================================================================
// MODEL — ModoContrarreloj: solo el jugador contra el reloj, sin rivales
// en la pista (PRD 018, D2 y D6).
// ================================================================
class ModoContrarreloj extends window.ModoCarrera {
    get clave()      { return 'contrarreloj'; }
    get nombre()     { return 'Contrarreloj'; }
    get hayRivales() { return false; }
}

window.ModoContrarreloj = ModoContrarreloj;
